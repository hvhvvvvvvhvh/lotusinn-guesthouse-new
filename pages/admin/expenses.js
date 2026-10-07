import { useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { filePaths, readJson } from '../../lib/dataStore';

export async function getServerSideProps() {
  const data = await readJson(filePaths.expenses);

  return {
    props: {
      items: data.expenses || [],
    },
  };
}

const emptyForm = {
  title: '',
  category: 'Kitchen',
  amount: '',
  date: '',
  paymentMethod: 'Cash',
  note: '',
};

function formatCurrency(amount) {
  return `PKR ${Number(amount || 0).toLocaleString()}`;
}

export default function AdminExpenses({ items }) {
  const [expenses, setExpenses] = useState(items || []);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = [
    'Kitchen',
    'Fuel',
    'Rooms',
    'Food',
    'Staff',
    'Maintenance',
    'Laundry',
    'Utilities',
    'Other',
  ];

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === 'All') return expenses;
    return expenses.filter((item) => item.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const totals = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const kitchen = expenses
      .filter((item) => item.category === 'Kitchen')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const fuel = expenses
      .filter((item) => item.category === 'Fuel')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const staff = expenses
      .filter((item) => item.category === 'Staff')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return { total, kitchen, fuel, staff };
  }, [expenses]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      amount: Number(form.amount || 0),
      id: editingId || `exp-${Date.now()}`,
    };

    const updatedExpenses = editingId
      ? expenses.map((item) => (item.id === editingId ? payload : item))
      : [payload, ...expenses];

    setExpenses(updatedExpenses);
    resetForm();

    try {
      await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses: updatedExpenses }),
      });
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      category: item.category || 'Kitchen',
      amount: item.amount || '',
      date: item.date || '',
      paymentMethod: item.paymentMethod || 'Cash',
      note: item.note || '',
    });
  };

  const handleDelete = async (id) => {
    const updatedExpenses = expenses.filter((item) => item.id !== id);
    setExpenses(updatedExpenses);

    try {
      await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses: updatedExpenses }),
      });
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  return (
    <AdminLayout title="Track daily guest house expenses, staff costs, kitchen, fuel and room operations.">
      <div className="expenses-page">
        <div className="expense-stats-grid">
          <div className="expense-stat-card">
            <span>Total Expenses</span>
            <strong>{formatCurrency(totals.total)}</strong>
          </div>

          <div className="expense-stat-card">
            <span>Kitchen Expense</span>
            <strong>{formatCurrency(totals.kitchen)}</strong>
          </div>

          <div className="expense-stat-card">
            <span>Fuel Expense</span>
            <strong>{formatCurrency(totals.fuel)}</strong>
          </div>

          <div className="expense-stat-card">
            <span>Staff Expense</span>
            <strong>{formatCurrency(totals.staff)}</strong>
          </div>
        </div>

        <div className="expenses-grid">
          <div className="admin-panel expense-form-panel">
            <div className="admin-header-row">
              <div>
                <h3>{editingId ? 'Edit Expense' : 'Add New Expense'}</h3>
                <p className="admin-muted">Record kitchen, fuel, rooms, food and staff expenses.</p>
              </div>
            </div>

            <form className="expense-form" onSubmit={handleSubmit}>
              <label>
                Expense Title
                <input
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g. Kitchen groceries"
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label>
                Amount
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="e.g. 5000"
                  required
                />
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </label>

              <label>
                Payment Method
                <select
                  value={form.paymentMethod}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                >
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>JazzCash</option>
                  <option>EasyPaisa</option>
                  <option>Card</option>
                </select>
              </label>

              <label className="expense-note">
                Note
                <textarea
                  value={form.note}
                  onChange={(e) => handleChange('note', e.target.value)}
                  placeholder="Add expense details..."
                />
              </label>

              <div className="expense-form-actions">
                <button type="submit" className="admin-btn">
                  {editingId ? 'Save Changes' : 'Add Expense'}
                </button>

                {editingId ? (
                  <button type="button" className="admin-btn admin-btn-outline" onClick={resetForm}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="admin-panel expense-list-panel">
            <div className="admin-header-row">
              <div>
                <h3>Expense Records</h3>
                <p className="admin-muted">Monitor and manage all guest house expenses.</p>
              </div>

              <select
                className="expense-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option>All</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="expense-list">
              {filteredExpenses.length ? (
                filteredExpenses.map((item) => (
                  <div className="expense-card" key={item.id}>
                    <div>
                      <span className="expense-category">{item.category}</span>
                      <h4>{item.title}</h4>
                      <p>{item.note || 'No additional note added.'}</p>
                      <small>{item.date} • {item.paymentMethod}</small>
                    </div>

                    <div className="expense-card-actions">
                      <strong>{formatCurrency(item.amount)}</strong>
                      <button type="button" className="admin-btn small" onClick={() => handleEdit(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn danger small"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="expense-empty">No expenses found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}