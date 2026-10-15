import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const sheetType = url.searchParams.get('sheetType') || 'family';
    const isFamily = sheetType.toLowerCase() === 'family';

    const service = new GoogleSheetsService(email);
    const targetType = isFamily ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(targetType);
    if (!spreadsheetId) {
      return NextResponse.json({ goals: [], summary: null });
    }

    const tabName = isFamily ? 'Family_Goals' : 'Goals';
    const rows = await service.getSheetData(spreadsheetId, `${tabName}!A:I`);

    if (!rows || rows.length <= 1) {
      return NextResponse.json({
        goals: [],
        summary: {
          totalGoals: 0,
          activeGoals: 0,
          completedGoals: 0,
          totalTargetAmount: 0,
          totalSavedAmount: 0,
          overallProgressPercentage: 0,
          topActiveGoal: null,
        },
      });
    }

    const rawGoals = rows.slice(1).map((row, index) => {
      const targetAmount = parseFloat(row[1]) || 0;
      const currentAmount = parseFloat(row[2]) || 0;
      const progressPercentage = targetAmount > 0
        ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
        : 0;
      const remainingAmount = Math.max(0, targetAmount - currentAmount);

      return {
        id: index + 1, // 1-based index corresponding to row (row index = id + 1)
        title: (row[0] || '').toString().trim(),
        targetAmount,
        currentAmount,
        status: (row[3] || 'Active').toString().trim(),
        goalType: (row[4] || 'Saving').toString().trim(), // 'Saving' or 'Purchase'
        targetDate: (row[5] || '').toString().trim(),
        addedBy: (row[6] || '').toString().trim(),
        note: (row[7] || '').toString().trim(),
        createdAt: (row[8] || '').toString().trim(),
        progressPercentage,
        remainingAmount,
      };
    });

    // Exclude archived goals
    const goals = rawGoals.filter(g => g.title && g.status.toLowerCase() !== 'archived');

    // Compute summary metrics for UI and Mobile Widgets
    const activeGoals = goals.filter(g => g.status.toLowerCase() === 'active');
    const completedGoals = goals.filter(g => g.status.toLowerCase() === 'completed');

    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSavedAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgressPercentage = totalTargetAmount > 0
      ? Math.min(100, Math.round((totalSavedAmount / totalTargetAmount) * 100 * 10) / 10)
      : 0;

    // Determine top active goal (highest progress but not yet completed)
    const topActiveGoal = activeGoals.length > 0
      ? [...activeGoals].sort((a, b) => b.progressPercentage - a.progressPercentage)[0]
      : null;

    return NextResponse.json({
      success: true,
      goals,
      summary: {
        totalGoals: goals.length,
        activeGoals: activeGoals.length,
        completedGoals: completedGoals.length,
        totalTargetAmount,
        totalSavedAmount,
        overallProgressPercentage,
        topActiveGoal,
      },
    });

  } catch (error: any) {
    console.error('Error in goals GET:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      title,
      targetAmount,
      currentAmount = 0,
      goalType = 'Saving',
      targetDate = '',
      note = '',
      sheetType = 'family',
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Goal title is required' }, { status: 400 });
    }

    const numericTarget = parseFloat(targetAmount);
    if (isNaN(numericTarget) || numericTarget <= 0) {
      return NextResponse.json({ error: 'Target amount must be greater than 0' }, { status: 400 });
    }

    const numericCurrent = Math.max(0, parseFloat(currentAmount) || 0);
    const initialStatus = numericCurrent >= numericTarget ? 'Completed' : 'Active';

    const isFamily = sheetType.toLowerCase() === 'family';
    const service = new GoogleSheetsService(email);
    const targetType = isFamily ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(targetType);
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });
    }

    const tabName = isFamily ? 'Family_Goals' : 'Goals';
    const createdAt = new Date().toISOString();

    await service.appendRow(spreadsheetId, tabName, [
      title.trim(),
      numericTarget,
      numericCurrent,
      initialStatus,
      goalType === 'Purchase' ? 'Purchase' : 'Saving',
      targetDate.trim(),
      email,
      note.trim(),
      createdAt,
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in goals POST:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, addAmount, sheetType = 'family' } = body;

    if (!id || id < 1) {
      return NextResponse.json({ error: 'Valid goal ID is required' }, { status: 400 });
    }

    const isFamily = sheetType.toLowerCase() === 'family';
    const service = new GoogleSheetsService(email);
    const targetType = isFamily ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(targetType);
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });
    }

    const tabName = isFamily ? 'Family_Goals' : 'Goals';
    const rowIndex = id + 1; // 1-based header offset

    // Read current row to ensure accurate atomic updates
    const rowData = await service.getSheetData(spreadsheetId, `${tabName}!A${rowIndex}:I${rowIndex}`);
    if (!rowData || rowData.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const currentRow = rowData[0];
    const targetAmount = parseFloat(currentRow[1]) || 0;
    let currentAmount = parseFloat(currentRow[2]) || 0;
    let status = currentRow[3] || 'Active';

    if (addAmount !== undefined) {
      const deposit = parseFloat(addAmount);
      if (isNaN(deposit) || deposit <= 0) {
        return NextResponse.json({ error: 'Deposit amount must be greater than 0' }, { status: 400 });
      }
      currentAmount += deposit;
      if (currentAmount >= targetAmount) {
        status = 'Completed';
      }

      await service.updateRow(spreadsheetId, `${tabName}!C${rowIndex}`, [currentAmount]);
      await service.updateRow(spreadsheetId, `${tabName}!D${rowIndex}`, [status]);

      return NextResponse.json({
        success: true,
        currentAmount,
        status,
        progressPercentage: targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0,
      });
    }

    // Direct field updates
    const newTitle = body.title !== undefined ? body.title : currentRow[0];
    const newTarget = body.targetAmount !== undefined ? parseFloat(body.targetAmount) : targetAmount;
    const newCurrent = body.currentAmount !== undefined ? parseFloat(body.currentAmount) : currentAmount;
    const newStatus = body.status !== undefined ? body.status : status;
    const newType = body.goalType !== undefined ? body.goalType : currentRow[4];
    const newDate = body.targetDate !== undefined ? body.targetDate : currentRow[5];
    const newNote = body.note !== undefined ? body.note : currentRow[7];

    await service.updateRow(spreadsheetId, `${tabName}!A${rowIndex}:H${rowIndex}`, [
      [newTitle, newTarget, newCurrent, newStatus, newType, newDate, currentRow[6] || email, newNote],
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in goals PATCH:', error);
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '0', 10);
    const sheetType = url.searchParams.get('sheetType') || 'family';

    if (!id || id < 1) {
      return NextResponse.json({ error: 'Valid goal ID is required' }, { status: 400 });
    }

    const isFamily = sheetType.toLowerCase() === 'family';
    const service = new GoogleSheetsService(email);
    const targetType = isFamily ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(targetType);
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });
    }

    const tabName = isFamily ? 'Family_Goals' : 'Goals';
    const rowIndex = id + 1;

    // Mark as Archived in Col D
    await service.updateRow(spreadsheetId, `${tabName}!D${rowIndex}`, ['Archived']);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in goals DELETE:', error);
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
