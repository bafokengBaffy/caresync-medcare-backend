import { Users, Calendar, Receipt, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { usePatients } from '@/hooks/use-patients';
import { useAppointments } from '@/hooks/use-appointments';
import { useInvoices } from '@/hooks/use-invoices';

export function DashboardPage() {
  const patients = usePatients({ size: 1 });
  const appointments = useAppointments({ size: 1 });
  const invoices = useInvoices({ size: 1 });
  const cards = [
    { title: 'Total Patients', value: patients.data?.total ?? 0, icon: Users, color: 'text-blue-600' },
    { title: 'Appointments', value: appointments.data?.total ?? 0, icon: Calendar, color: 'text-purple-600' },
    { title: 'Invoices', value: invoices.data?.total ?? 0, icon: Receipt, color: 'text-orange-600' },
    { title: 'Revenue (MTD)', value: '$0', icon: TrendingUp, color: 'text-green-600' },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your practice" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
