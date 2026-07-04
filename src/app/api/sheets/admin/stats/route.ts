import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new GoogleSheetsService(email);
    
    // 1. Resolve Admin Spreadsheet ID and Family Spreadsheet ID
    const adminSheetId = process.env.ADMIN_SPREADSHEET_ID;
    const familySheetId = process.env.FAMILY_SPREADSHEET_ID;
    
    if (!adminSheetId || !familySheetId) {
      return NextResponse.json({ error: 'Spreadsheet credentials are not fully configured in environment' }, { status: 500 });
    }

    // Ensure family spreadsheet layout is initialized
    await service.findOrCreateSheet('Family');

    // Ensure admin spreadsheet User_Sheets index exists
    await service.ensureSheetsExist(adminSheetId, 'Admin');

    // 2. Fetch Family Members to find user's family code
    let memberRows = await service.getSheetData(familySheetId, 'Family_Members!A:F');
    
    // Auto-initialize admin as a member if sheet has only headers
    if (memberRows.length <= 1) {
      const defaultFamilyCode = `FAM_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const defaultNickname = email.split('@')[0];
      const joinedDate = new Date().toISOString().split('T')[0];
      
      await service.appendRow(familySheetId, 'Family_Members', [
        defaultFamilyCode,
        email,
        'Admin',
        joinedDate,
        defaultNickname,
        '0'
      ]);
      
      // Re-fetch member rows
      memberRows = await service.getSheetData(familySheetId, 'Family_Members!A:F');
    }

    const userRow = memberRows.slice(1).find(r => r[1]?.toString().trim().toLowerCase() === email.toLowerCase());
    
    if (!userRow) {
      // User is not in any family yet
      return NextResponse.json({
        joinedFamily: false,
        userRole: 'Admin',
        userSheets: [],
        totals: { totalSpend: 0, totalIncome: 0, netSavings: 0, activeMembersCount: 0, activeLoansCount: 0, pendingDuesCount: 0 }
      });
    }

    const familyCode = userRow[0];
    const userRole = userRow[2]; // Admin or Member

    // Only Admins can see the consolidated dashboard stats
    if (userRole !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 3. Fetch all other sheets concurrently
    const [expenseRows, monthlyRows, loanRows, userSheetsRows] = await Promise.all([
      service.getSheetData(familySheetId, 'Family_Expenses!A:F'),
      service.getSheetData(familySheetId, 'Monthly_Expenses!A:J'),
      service.getSheetData(familySheetId, 'Loans!A:G'),
      service.getSheetData(adminSheetId, 'User_Sheets!A:B')
    ]);

    // 4. Map and filter family members
    const members = memberRows.slice(1)
      .filter(r => r[0] === familyCode)
      .map(r => ({
        email: r[1],
        role: r[2],
        joinedDate: r[3],
        nickname: r[4] || 'Unknown',
        monthlyIncome: parseFloat(r[5]) || 0
      }));

    // 5. Map and filter family expenses
    const expenses = expenseRows.slice(1)
      .map((r, index) => ({
        date: r[0],
        amount: parseFloat(r[1]) || 0,
        category: r[2],
        note: r[3],
        addedBy: r[4],
        familyCode: r[5],
        id: index + 1
      }))
      .filter(r => r.familyCode === familyCode);

    // 6. Map and filter monthly dues
    const dues = monthlyRows.slice(1)
      .map((r, index) => ({
        title: r[0],
        amount: parseFloat(r[1]) || 0,
        dueDay: parseInt(r[2]) || 1,
        status: r[3],
        familyCode: r[4],
        adminEmail: r[5],
        lastPaidDate: r[6] || '',
        lastPaidBy: r[7] || '',
        linkedLoan: r[8] || '',
        assignedTo: r[9] || 'Family',
        id: index + 1
      }))
      .filter(r => r.familyCode === familyCode);

    // 7. Map and filter loans
    const loans = loanRows.slice(1)
      .map((r, index) => ({
        name: r[0],
        amount: parseFloat(r[1]) || 0,
        monthlyEMI: parseFloat(r[2]) || 0,
        assignedTo: r[3],
        familyCode: r[4],
        adminEmail: r[5],
        status: r[6] || 'Active',
        id: index + 1
      }))
      .filter(r => r.familyCode === familyCode);

    // 8. Map employee spreadsheets from Admin Spreadsheet Index
    const userSheets = userSheetsRows.slice(1).map((r, index) => {
      const sheetId = r[1]?.toString() || '';
      return {
        email: r[0]?.toString() || '',
        spreadsheetId: sheetId,
        url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        id: index + 1
      };
    });

    // 9. Calculations
    const totalSpend = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalIncome = members.reduce((sum, item) => sum + item.monthlyIncome, 0);
    const activeMembersCount = members.length;
    const activeLoansCount = loans.filter(l => l.status === 'Active').length;
    const pendingDuesCount = dues.filter(d => d.status === 'Unpaid').length;

    // Category breakdown for charts
    const categoriesMap: Record<string, number> = {};
    expenses.forEach(e => {
      categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
    });

    const categoryBreakdown = Object.entries(categoriesMap).map(([name, value]) => ({
      name,
      value
    }));

    return NextResponse.json({
      joinedFamily: true,
      familyCode,
      userRole,
      totals: {
        totalSpend,
        totalIncome,
        netSavings: totalIncome - totalSpend,
        activeMembersCount,
        activeLoansCount,
        pendingDuesCount
      },
      categoryBreakdown,
      recentExpenses: expenses.reverse().slice(0, 10),
      members,
      dues,
      loans,
      userSheets
    });

  } catch (error: any) {
    console.error('Error in Admin Stats API:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
