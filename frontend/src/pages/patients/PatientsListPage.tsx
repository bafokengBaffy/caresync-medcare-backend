import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Eye, Loader2, Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePatients } from '@/hooks/use-patients';
import { useUiStore } from '@/stores/ui-store';
import { translate, type TranslationKey } from '@/lib/i18n';

export default function PatientsListPage() {
  const language = useUiStore((state) => state.language);
  const t = (key: TranslationKey) => translate(language, key);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  const { data, isLoading, isError, error } = usePatients({ q: search, page, size });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="h-6 w-6 text-primary" /> {t('patients.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('patients.description')}</p>
        </div>
        <Button asChild>
          <Link to="/patients/new">
            <Plus className="mr-2 h-4 w-4" /> {t('patients.new')}
          </Link>
        </Button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder={t('patients.search')}
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-lg border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-12 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h2 className="font-semibold">{t('patients.loadError')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{(error as Error)?.message || t('common.retry')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('patients.contact')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Patient ID</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('patients.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.content ?? []).map((patient) => (
                <tr key={patient.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                    <div className="text-xs text-muted-foreground">{new Date(patient.dateOfBirth).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <div>{patient.email || '—'}</div>
                    <div>{patient.phone || '—'}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{patient.id}</td>
                  <td className="px-6 py-4 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/patients/${encodeURIComponent(patient.id)}`}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.content || data.content.length === 0) && (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-4 h-10 w-10" />
              <p>{t('patients.noResults')}</p>
            </div>
          )}
          {data && data.total > size && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">{data.total} patients</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={(page + 1) * size >= data.total} onClick={() => setPage((current) => current + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
