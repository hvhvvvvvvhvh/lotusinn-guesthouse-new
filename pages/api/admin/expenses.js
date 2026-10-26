import { filePaths, readJson, writeJson } from '../../../lib/dataStore';
import { requireAdminApi } from '../../../lib/adminAuth.js';
import { apiError, invalid, dateOnly, text } from '../../../lib/validation.js';

export default async function handler(req, res) {
  if (!await requireAdminApi(req, res)) return;
  try {
    if (req.method === 'GET') {
      const data = await readJson(filePaths.expenses);
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      if (!Array.isArray(req.body?.expenses)) invalid('Expenses must be a list.');
      const expenses = req.body.expenses.map(item => {
        if (!item || typeof item !== 'object') invalid('Invalid expense.');
        const amount = Number(item.amount);
        if (!Number.isFinite(amount) || amount <= 0) invalid('Expense amount must be greater than zero.');
        return { id: text(item.id, 'Expense id', { required: true }), title: text(item.title, 'Title', { required: true }), category: text(item.category, 'Category', { required: true }), date: dateOnly(item.date, 'Expense date'), amount, paymentMethod: text(item.paymentMethod, 'Payment method'), note: text(item.note, 'Note', { max: 5000 }) };
      });
      await writeJson(filePaths.expenses, { expenses });
      return res.status(200).json({ success: true, expenses });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return apiError(res, error, 'Failed to process expenses.');
  }
}
