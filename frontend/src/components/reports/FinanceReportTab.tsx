import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3, TrendingUp, TrendingDown, Wallet, Plus, Pencil, Trash2, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle,
} from '@/components/ui/modal';
import { StatCard, formatCurrency } from '@/components/dashboard/StatCard';
import type { FinancialReport, Expense, ExpenseInput, PaginatedResponse } from '@magazin/shared';
import { ExpenseCategory as ExpenseCategoryEnum, type ExpenseCategory } from '@magazin/shared';
import { formatDate } from '@/lib/locale';

const COLORS = ['hsl(152, 69%, 31%)', 'hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(280, 60%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(190, 70%, 45%)'];

const CATEGORY_KEYS: Record<ExpenseCategory, string> = {
  [ExpenseCategoryEnum.RENT]: 'reports.catRent',
  [ExpenseCategoryEnum.SALARY]: 'reports.catSalary',
  [ExpenseCategoryEnum.UTILITIES]: 'reports.catUtilities',
  [ExpenseCategoryEnum.SUPPLIES]: 'reports.catSupplies',
  [ExpenseCategoryEnum.MARKETING]: 'reports.catMarketing',
  [ExpenseCategoryEnum.OTHER]: 'reports.catOther',
};

interface FinanceReportTabProps {
  report: FinancialReport;
  expenses: PaginatedResponse<Expense> | null;
  period: string;
  canManage: boolean;
  onCreateExpense: (input: ExpenseInput) => Promise<unknown>;
  onUpdateExpense: (id: string, input: ExpenseInput) => Promise<unknown>;
  onDeleteExpense: (id: string) => Promise<void>;
  refDate: string;
}

export function FinanceReportTab({
  report, expenses, period, canManage, onCreateExpense, onUpdateExpense, onDeleteExpense, refDate,
}: FinanceReportTabProps) {
  const { t, i18n } = useTranslation();
  const { summary } = report;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<ExpenseInput>({
    title: '', amount: 0, category: ExpenseCategoryEnum.OTHER,
    description: '', expenseDate: refDate,
  });

  const chartData = report.breakdown.map((b) => ({
    name: b.label,
    revenue: b.revenue,
    expenses: b.totalExpenses,
    profit: b.profit,
  }));

  const expensePie = report.expensesByCategory.map((e) => ({
    name: t(CATEGORY_KEYS[e.category]),
    value: e.amount,
    share: e.sharePercent,
  }));

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', amount: 0, category: ExpenseCategoryEnum.OTHER, description: '', expenseDate: refDate });
    setFormOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      title: e.title, amount: e.amount, category: e.category,
      description: e.description ?? '', expenseDate: e.expenseDate.split('T')[0],
    });
    setFormOpen(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      if (editing) await onUpdateExpense(editing.id, form);
      else await onCreateExpense(form);
      setFormOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || t('reports.saveError'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setFormLoading(true);
    try {
      await onDeleteExpense(deleting.id);
      setDeleting(null);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {canManage && (
          <Button size="touch" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('reports.addExpense')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('reports.revenue')} value={formatCurrency(summary.revenue)} icon={TrendingUp} variant="success" />
        <StatCard title={t('reports.totalExpenses')} value={formatCurrency(summary.totalExpenses)} icon={TrendingDown} variant="destructive" />
        <StatCard title={t('reports.profit')} value={formatCurrency(summary.profit)} icon={Wallet} variant={summary.profit >= 0 ? 'default' : 'destructive'} />
        <StatCard title={t('reports.profitMargin')} value={`${summary.profitMargin}%`} icon={BarChart3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.chartTitle')}</CardTitle>
            <CardDescription>{t(`reports.period_${period}`)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="finRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 69%, 31%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 69%, 31%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name={t('reports.revenue')} stroke="hsl(152, 69%, 31%)" fill="url(#finRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name={t('reports.profit')} stroke="hsl(217, 91%, 60%)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reports.expenseCategoryChart')}</CardTitle>
            <CardDescription>{t('reports.operatingDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {expensePie.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">{t('reports.noExpenses')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={expensePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}
                    label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {expensePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.financeBarChart')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Legend />
              <Bar dataKey="revenue" name={t('reports.revenue')} fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name={t('reports.totalExpenses')} fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name={t('reports.profit')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('reports.cogs')}</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(summary.cogs)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('reports.operating')}</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(summary.operatingExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('reports.formula')}</p>
            <p className="text-sm font-medium mt-1">{t('reports.formulaText')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.expensesList')}</CardTitle>
          <CardDescription>{t('reports.expensesListDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!expenses?.items.length ? (
            <p className="text-center text-muted-foreground py-8">{t('reports.noExpenses')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.expenseDate')}</TableHead>
                  <TableHead>{t('reports.expenseTitle')}</TableHead>
                  <TableHead>{t('reports.category')}</TableHead>
                  <TableHead className="text-right">{t('reports.amount')}</TableHead>
                  {canManage && <TableHead>{t('reports.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.expenseDate, i18n.language)}</TableCell>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell><Badge variant="outline">{t(CATEGORY_KEYS[e.category])}</Badge></TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(e.amount)}</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-touch" onClick={() => openEdit(e)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-touch" className="text-destructive" onClick={() => setDeleting(e)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal open={formOpen} onOpenChange={setFormOpen}>
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              <ModalTitle>{editing ? t('reports.editExpense') : t('reports.addExpense')}</ModalTitle>
              <ModalDescription>{t('reports.expenseFormDesc')}</ModalDescription>
            </ModalHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('reports.expenseTitle')}</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('reports.amount')}</Label>
                  <Input type="number" min="0.01" step="0.01" required value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('reports.expenseDate')}</Label>
                  <Input type="date" required value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('reports.category')}</Label>
                <select className="flex h-touch w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>
                  {Object.values(ExpenseCategoryEnum).map((c) => (
                    <option key={c} value={c}>{t(CATEGORY_KEYS[c])}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('reports.description')}</Label>
                <Input value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>
            <ModalFooter>
              <Button type="button" variant="outline" size="touch" onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" size="touch" disabled={formLoading}>
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t('reports.deleteExpense')}</ModalTitle>
            <ModalDescription>{t('reports.deleteExpenseDesc', { name: deleting?.title })}</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" size="touch" onClick={() => setDeleting(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" size="touch" onClick={handleDelete} disabled={formLoading}>{t('common.delete')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
