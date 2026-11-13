import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';
import { sendFcmToUsers } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const familyCode = url.searchParams.get('familyCode');
    const monthKey = url.searchParams.get('monthKey') || new Date().toISOString().slice(0, 7);
    if (!familyCode) return NextResponse.json({ error: 'Family code required' }, { status: 400 });

    const targetCode = familyCode.trim().toUpperCase();
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ loans: [], expenses: [], repayments: [], homeLoanConfig: null, monthlyTracking: [] });

    const [loansRows, expensesRows, repaymentRows, homeLoanConfigRows, trackingRows] = await Promise.all([
      service.getSheetData(spreadsheetId, 'Loans!A:N'),
      service.getSheetData(spreadsheetId, 'Loan_Expenses!A:G'),
      service.getSheetData(spreadsheetId, 'Loan_Repayments!A:E'),
      service.getSheetData(spreadsheetId, 'HomeLoan_Config!A:K'),
      service.getSheetData(spreadsheetId, 'EMI_Monthly_Tracking!A:K'),
    ]);

    const loans = loansRows.slice(1)
      .map((r, index) => ({
        name: r[0],
        amount: parseFloat(r[1]) || 0,
        monthlyEMI: parseFloat(r[2]) || 0,
        assignedTo: r[3]?.toString().trim() || '',
        familyCode: r[4],
        adminEmail: r[5],
        status: r[6] || 'Active',
        interestRate: parseFloat(r[7]) || 0,
        startDate: r[8]?.toString().trim() || '',
        balanceRemaining: r[9] !== undefined && r[9] !== '' ? (parseFloat(r[9]) || 0) : (parseFloat(r[1]) || 0),
        tenureMonths: parseInt(r[10]) || 0,
        paidMonths: parseInt(r[11]) || 0,
        payerName: r[12]?.toString().trim() || 'Ajesh',
        shareRecipient: r[13]?.toString().trim() || 'Nisha',
        id: index + 1
      }))
      .filter(r => String(r.familyCode ?? '').trim().toUpperCase() === targetCode);

    const expenses = expensesRows.slice(1)
      .filter(r => String(r[6] ?? '').trim().toUpperCase() === targetCode)
      .map(r => ({
        date: r[0],
        amount: parseFloat(r[1]) || 0,
        category: r[2],
        note: r[3],
        loanName: r[4],
        addedBy: r[5],
        familyCode: r[6]
      }));

    const repayments = repaymentRows.slice(1)
      .filter(r => String(r[4] ?? '').trim().toUpperCase() === targetCode)
      .map(r => ({
        date: r[0],
        amount: parseFloat(r[1]) || 0,
        loanName: r[2],
        paidBy: r[3],
        familyCode: r[4]
      }));

    const configRow = homeLoanConfigRows.slice(1).find(r => String(r[0] ?? '').trim().toUpperCase() === targetCode);
    const homeLoanConfig = configRow ? {
      familyCode: String(configRow[0] ?? '').trim(),
      principalAmount: parseFloat(configRow[1]) || 0,
      interestRate: parseFloat(configRow[2]) || 0,
      startDate: String(configRow[3] ?? '').trim(),
      balanceRemaining: parseFloat(configRow[4]) || 0,
      monthlyEMI: parseFloat(configRow[5]) || 0,
      dueDay: parseInt(configRow[6]) || 10,
      payerName: String(configRow[7] ?? '').trim() || 'Ajesh',
      shareRecipient: String(configRow[8] ?? '').trim() || 'Nisha',
      updatedAt: String(configRow[9] ?? '').trim(),
      updatedBy: String(configRow[10] ?? '').trim(),
    } : null;

    const monthlyTracking = trackingRows.slice(1)
      .map((r, index) => ({
        monthKey: String(r[0] ?? '').trim(),
        loanKey: String(r[1] ?? '').trim(),
        familyCode: String(r[2] ?? '').trim(),
        paidToPayer: String(r[3] ?? '').toLowerCase() === 'true',
        paidAt: String(r[4] ?? '').trim(),
        paidBy: String(r[5] ?? '').trim(),
        sharedWithRecipient: String(r[6] ?? '').toLowerCase() === 'true',
        sharedAt: String(r[7] ?? '').trim(),
        sharedBy: String(r[8] ?? '').trim(),
        autoSmsDetected: String(r[9] ?? '').toLowerCase() === 'true',
        note: String(r[10] ?? '').trim(),
        id: index + 1,
      }))
      .filter(r => r.familyCode.toUpperCase() === targetCode && r.monthKey === monthKey);

    return NextResponse.json({ loans, expenses, repayments, homeLoanConfig, monthlyTracking });

  } catch (error: any) {
    console.error('Loans GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      action,
      loanName,
      amount,
      monthlyEMI,
      assignedTo,
      familyCode,
      expense,
      interestRate,
      startDate,
      balanceRemaining,
      tenureMonths,
      paidMonths,
      payerName,
      shareRecipient,
      monthKey,
      loanKey,
      paidToPayer,
      sharedWithRecipient,
      autoSmsDetected,
      note,
      logAmount,
    } = await request.json();
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    if (action === 'addLoan') {
      const effectiveBalance = balanceRemaining !== undefined && balanceRemaining !== '' ? balanceRemaining : amount;
      await service.appendRow(spreadsheetId, 'Loans', [
        loanName,
        amount,
        monthlyEMI,
        assignedTo,
        familyCode,
        email,
        'Active',
        interestRate ?? 0,
        startDate || '',
        effectiveBalance,
        tenureMonths ?? 0,
        paidMonths ?? 0,
        payerName || 'Ajesh',
        shareRecipient || 'Nisha'
      ]);

      await service.appendRow(spreadsheetId, 'Monthly_Expenses', [
        `EMI: ${loanName}`,
        monthlyEMI,
        10,
        'Unpaid',
        familyCode,
        email,
        '',
        '',
        loanName,
        assignedTo
      ]);

      return NextResponse.json({ success: true });
    }

    if (action === 'confirmMonthlyTracking') {
      if (!familyCode || !loanKey) {
        return NextResponse.json({ error: 'familyCode and loanKey are required' }, { status: 400 });
      }
      const targetMonth = (monthKey || new Date().toISOString().slice(0, 7)).toString().trim();
      const targetCode = familyCode.toString().trim().toUpperCase();
      const nowIso = new Date().toISOString();

      const trackingRows = await service.getSheetData(spreadsheetId, 'EMI_Monthly_Tracking!A:K');
      const existingIdx = trackingRows.findIndex(
        (r, idx) => idx > 0 &&
          String(r[0] ?? '').trim() === targetMonth &&
          String(r[1] ?? '').trim().toLowerCase() === loanKey.toString().trim().toLowerCase() &&
          String(r[2] ?? '').trim().toUpperCase() === targetCode
      );

      const existing = existingIdx !== -1 ? trackingRows[existingIdx] : null;
      const nextPaid = paidToPayer !== undefined ? Boolean(paidToPayer) : (String(existing?.[3] ?? '').toLowerCase() === 'true');
      const nextPaidAt = paidToPayer === true ? (existing?.[4] || nowIso) : (existing?.[4] || '');
      const nextPaidBy = paidToPayer === true ? (existing?.[5] || email) : (existing?.[5] || '');
      const nextShared = sharedWithRecipient !== undefined ? Boolean(sharedWithRecipient) : (String(existing?.[6] ?? '').toLowerCase() === 'true');
      const nextSharedAt = sharedWithRecipient === true ? (existing?.[7] || nowIso) : (existing?.[7] || '');
      const nextSharedBy = sharedWithRecipient === true ? (existing?.[8] || email) : (existing?.[8] || '');
      const nextAutoSms = autoSmsDetected !== undefined ? Boolean(autoSmsDetected) : (String(existing?.[9] ?? '').toLowerCase() === 'true');
      const nextNote = note !== undefined ? String(note) : (existing?.[10] || '');

      const rowValues = [
        targetMonth,
        loanKey.toString().trim(),
        familyCode.toString().trim(),
        nextPaid ? 'TRUE' : 'FALSE',
        nextPaidAt,
        nextPaidBy,
        nextShared ? 'TRUE' : 'FALSE',
        nextSharedAt,
        nextSharedBy,
        nextAutoSms ? 'TRUE' : 'FALSE',
        nextNote
      ];

      if (existingIdx !== -1) {
        await service.updateRow(spreadsheetId, `EMI_Monthly_Tracking!A${existingIdx + 1}:K${existingIdx + 1}`, rowValues);
      } else {
        await service.appendRow(spreadsheetId, 'EMI_Monthly_Tracking', rowValues);
      }

      // If EMI paid for the first time this month, log to Family_Expenses (EMI) and mark linked Monthly_Expenses paid
      const wasAlreadyPaid = String(existing?.[3] ?? '').toLowerCase() === 'true';
      if (paidToPayer === true && !wasAlreadyPaid) {
        const parsedAmount = Number(logAmount) || 0;
        if (parsedAmount > 0) {
          await service.appendRow(spreadsheetId, 'Family_Expenses', [
            nowIso,
            parsedAmount,
            loanKey.toString().toLowerCase().includes('home') ? 'Home Loan' : 'EMI',
            nextNote || `Monthly EMI paid (${loanKey})`,
            email,
            familyCode.toString().trim()
          ]);
        }

        const monthlyRows = await service.getSheetData(spreadsheetId, 'Monthly_Expenses!A:J');
        const linkedIdx = monthlyRows.findIndex(
          (r, idx) => idx > 0 &&
            String(r[4] ?? '').trim().toUpperCase() === targetCode &&
            (String(r[8] ?? '').trim().toLowerCase() === loanKey.toString().trim().toLowerCase() ||
              String(r[0] ?? '').trim().toLowerCase().includes(loanKey.toString().trim().toLowerCase()))
        );
        if (linkedIdx !== -1) {
          const rNum = linkedIdx + 1;
          await service.updateSheetData(spreadsheetId, `Monthly_Expenses!D${rNum}`, [['Paid']]);
          await service.updateSheetData(spreadsheetId, `Monthly_Expenses!G${rNum}:H${rNum}`, [[nowIso, email]]);
        }

        // Send Notification to Mom and Abhilash as requested:
        // "as ajesh paid loan 'loan-name' amount 'amount' at 'date'"
        let payerDisplayName = 'Ajesh';
        try {
          const loansRows = await service.getSheetData(spreadsheetId, 'Loans!A:N');
          const matchedLoan = loansRows.slice(1).find(
            (r) => String(r[0] ?? '').trim().toLowerCase() === loanKey.toString().trim().toLowerCase()
          );
          if (matchedLoan && matchedLoan[12]) {
            payerDisplayName = String(matchedLoan[12]).trim();
          }
        } catch (_) {}

        const formattedAmount = parsedAmount > 0 ? parsedAmount.toLocaleString('en-IN') : String(logAmount || '');
        const dateObj = new Date(nowIso);
        const formattedDate = dateObj.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });

        const notifTitle = `EMI Payment Completed: ${loanKey}`;
        const notifBody = `${payerDisplayName} paid loan "${loanKey}" amount "₹${formattedAmount}" at "${formattedDate}"`;

        // 1. Add in-app Notification row in Google Sheets
        try {
          await service.appendRow(spreadsheetId, 'Notifications', [
            nowIso,
            notifTitle,
            notifBody,
            familyCode.toString().trim(),
            'emi_payment',
            email
          ]);
        } catch (e) {
          console.error('[Loans] Failed to append notification row:', e);
        }

        // 2. Dispatch FCM Push Notification to Mom & Abhilash
        try {
          const membersRows = await service.getSheetData(spreadsheetId, 'Family_Members!A:G');
          const familyMembers = membersRows.slice(1).filter(
            (m) => String(m[0] ?? '').trim().toUpperCase() === targetCode
          );

          const targetEmails = new Set<string>();
          for (const m of familyMembers) {
            const mEmail = String(m[1] ?? '').trim().toLowerCase();
            const mRole = String(m[2] ?? '').trim().toLowerCase();
            const mNick = String(m[4] ?? '').trim().toLowerCase();
            if (!mEmail.includes('@')) continue;

            // Abhilash (Admin)
            if (mEmail.includes('abhilash') || mRole === 'admin' || mNick.includes('abhilash')) {
              targetEmails.add(mEmail);
            }
            // Mom (Nisha)
            if (mEmail.includes('nisha') || mNick.includes('nisha') || mNick.includes('mom') || mNick.includes('mother')) {
              targetEmails.add(mEmail);
            }
          }

          if (targetEmails.size === 0) {
            familyMembers.forEach((m) => {
              const e = String(m[1] ?? '').trim().toLowerCase();
              if (e.includes('@')) targetEmails.add(e);
            });
          }

          if (targetEmails.size > 0) {
            await sendFcmToUsers(Array.from(targetEmails), {
              title: notifTitle,
              body: notifBody,
              channelId: 'payment_channel',
              data: {
                type: 'emi_paid',
                loanKey: String(loanKey),
                amount: String(parsedAmount),
                payerName: payerDisplayName,
                familyCode: targetCode,
              },
            });
          }
        } catch (fcmErr) {
          console.error('[Loans] Failed to send FCM for EMI payment:', fcmErr);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'addLoanExpense') {
      await service.appendRow(spreadsheetId, 'Loan_Expenses', [
        expense.date || new Date().toISOString(),
        expense.amount,
        expense.category || 'Loan Spend',
        expense.note || '',
        loanName,
        email,
        familyCode
      ]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Loans POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      id,
      name,
      amount,
      monthlyEMI,
      assignedTo,
      status,
      interestRate,
      startDate,
      balanceRemaining,
      tenureMonths,
      paidMonths,
      payerName,
      shareRecipient,
    } = await request.json();
    if (id === undefined || !name || amount === undefined || monthlyEMI === undefined || !assignedTo || !status) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    // Admin Check
    const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
    const memberRow = members.slice(1).find(m => m[1]?.toLowerCase() === email.toLowerCase());
    if (!memberRow || memberRow[2] !== 'Admin') {
      return NextResponse.json({ error: 'Only Admins can update loans' }, { status: 403 });
    }

    // Get the old loan name to find linked monthly dues
    const oldLoans = await service.getSheetData(spreadsheetId, 'Loans!A:N');
    const oldLoanRow = oldLoans[id]; // row index is id
    if (!oldLoanRow) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    const oldLoanName = oldLoanRow[0];

    const rowIndex = id + 1; // row index in sheet is id + 1

    // Update the Loan entry: A-D, G, and H-N config fields
    const loanUpdates = [
      { range: `Loans!A${rowIndex}:D${rowIndex}`, values: [[name, amount, monthlyEMI, assignedTo]] },
      { range: `Loans!G${rowIndex}:N${rowIndex}`, values: [[
        status,
        interestRate !== undefined ? interestRate : (parseFloat(oldLoanRow[7]) || 0),
        startDate !== undefined ? startDate : (oldLoanRow[8] || ''),
        balanceRemaining !== undefined ? balanceRemaining : (oldLoanRow[9] !== undefined && oldLoanRow[9] !== '' ? parseFloat(oldLoanRow[9]) : amount),
        tenureMonths !== undefined ? tenureMonths : (parseInt(oldLoanRow[10]) || 0),
        paidMonths !== undefined ? paidMonths : (parseInt(oldLoanRow[11]) || 0),
        payerName !== undefined ? payerName : (oldLoanRow[12] || 'Ajesh'),
        shareRecipient !== undefined ? shareRecipient : (oldLoanRow[13] || 'Nisha'),
      ]] }
    ];

    for (const update of loanUpdates) {
      await service.updateSheetData(spreadsheetId, update.range, update.values);
    }

    // Now, synchronize with Monthly_Expenses
    const monthlyRows = await service.getSheetData(spreadsheetId, 'Monthly_Expenses!A:J');
    const linkedDuesIndex = monthlyRows.findIndex(r => r[8] === oldLoanName); // col I (linkedLoan) is index 8

    if (linkedDuesIndex !== -1) {
      const duesRowIndex = linkedDuesIndex + 1; // row index in sheet is index + 1
      const duesUpdates = [
        { range: `Monthly_Expenses!A${duesRowIndex}`, values: [[`EMI: ${name}`]] },
        { range: `Monthly_Expenses!B${duesRowIndex}`, values: [[monthlyEMI]] },
        { range: `Monthly_Expenses!I${duesRowIndex}`, values: [[name]] }, // Update the link pointer as well
        { range: `Monthly_Expenses!J${duesRowIndex}`, values: [[assignedTo]] }
      ];

      for (const update of duesUpdates) {
        await service.updateSheetData(spreadsheetId, update.range, update.values);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Loans PUT Error:', error);
    return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const idStr = url.searchParams.get('id');
    if (!idStr) return NextResponse.json({ error: 'ID parameter required' }, { status: 400 });
    const id = parseInt(idStr);

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    // Admin Check
    const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
    const memberRow = members.slice(1).find(m => m[1]?.toLowerCase() === email.toLowerCase());
    if (!memberRow || memberRow[2] !== 'Admin') {
      return NextResponse.json({ error: 'Only Admins can delete loans' }, { status: 403 });
    }

    // Get the loan name to delete linked monthly dues
    const oldLoans = await service.getSheetData(spreadsheetId, 'Loans!A:G');
    const oldLoanRow = oldLoans[id];
    if (!oldLoanRow) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    const loanName = oldLoanRow[0];

    const rowIndex = id + 1;
    await service.deleteRow(spreadsheetId, 'Loans', rowIndex);

    // Now, synchronize and delete from Monthly_Expenses
    const monthlyRows = await service.getSheetData(spreadsheetId, 'Monthly_Expenses!A:J');
    const linkedDuesIndex = monthlyRows.findIndex(r => r[8] === loanName); // col I (linkedLoan) is index 8

    if (linkedDuesIndex !== -1) {
      const duesRowIndex = linkedDuesIndex + 1;
      await service.deleteRow(spreadsheetId, 'Monthly_Expenses', duesRowIndex);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Loans DELETE Error:', error);
    return NextResponse.json({ error: 'Delete failed', details: error.message }, { status: 500 });
  }
}
