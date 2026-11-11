import { useState } from 'react';
import type { FormEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Archive, ClipboardPlus, LoaderCircle, Pencil, Plus, RefreshCw, Save, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export interface ClinicalRecordRow {
  id: string;
  patient: string;
  provider: string;
  date: string;
  title: string;
  summary: string;
  status?: string;
  form: Record<string, string>;
}

export interface ClinicalField {
  name: string;
  label: string;
  kind: 'text' | 'date' | 'datetime-local' | 'textarea' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface ClinicalRecordWorkspaceProps {
  title: string;
  description: string;
  icon: LucideIcon;
  records: ClinicalRecordRow[];
  fields: ClinicalField[];
  defaults: Record<string, string>;
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  isArchiving: boolean;
  onRefresh: () => void;
  onSave: (id: string | undefined, values: Record<string, string>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export function ClinicalRecordWorkspace({
  title,
  description,
  icon: Icon,
  records,
  fields,
  defaults,
  isLoading,
  isError,
  isSaving,
  isArchiving,
  onRefresh,
  onSave,
  onArchive,
}: ClinicalRecordWorkspaceProps) {
  const [editing, setEditing] = useState<{ id?: string; values: Record<string, string> }>();
  const [search, setSearch] = useState('');
  const visibleRecords = records.filter((record) =>
    [record.patient, record.provider, record.title, record.summary, record.status]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search.trim().toLowerCase())),
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    try {
      await onSave(editing.id, editing.values);
      setEditing(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save record');
    }
  };

  const archive = async (record: ClinicalRecordRow) => {
    if (!window.confirm(`Archive this ${title.toLowerCase()} record? It will be hidden from active lists.`)) return;
    try {
      await onArchive(record.id);
      if (editing?.id === record.id) setEditing(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to archive record');
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh} aria-label={`Refresh ${title}`}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => setEditing({ values: { ...defaults } })}>
            <Plus className="mr-2 h-4 w-4" /> New record
          </Button>
        </div>
      </header>

      {editing && (
        <form onSubmit={submit} className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <ClipboardPlus className="h-5 w-5 text-primary" />
              {editing.id ? `Edit ${title}` : `Create ${title}`}
            </h2>
            <Button type="button" variant="ghost" size="icon" aria-label="Close form" onClick={() => setEditing(undefined)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <label key={field.name} className={`space-y-1.5 text-sm font-medium text-foreground ${field.kind === 'textarea' ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
                <span>{field.label}{field.required && <span className="text-destructive"> *</span>}</span>
                {field.kind === 'textarea' ? (
                  <textarea
                    required={field.required}
                    rows={3}
                    value={editing.values[field.name] ?? ''}
                    onChange={(event) => setEditing({ ...editing, values: { ...editing.values, [field.name]: event.target.value } })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                ) : field.kind === 'select' ? (
                  <select
                    required={field.required}
                    value={editing.values[field.name] ?? ''}
                    onChange={(event) => setEditing({ ...editing, values: { ...editing.values, [field.name]: event.target.value } })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.kind}
                    required={field.required}
                    value={editing.values[field.name] ?? ''}
                    onChange={(event) => setEditing({ ...editing, values: { ...editing.values, [field.name]: event.target.value } })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                )}
              </label>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(undefined)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Saving…' : editing.id ? 'Save changes' : 'Create record'}
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Active records</h2>
            <p className="text-sm text-muted-foreground">{records.length} records</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records"
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <LoaderCircle className="h-5 w-5 animate-spin" /> Loading records…
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive">Records could not be loaded.</p>
            <Button className="mt-3" variant="outline" onClick={onRefresh}>Try again</Button>
          </div>
        ) : visibleRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Icon className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium text-foreground">{records.length ? 'No matching records' : 'No records yet'}</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a record to start a tenant-scoped clinical history.</p>
          </div>
        ) : (
          <div className="divide-y">
            {visibleRecords.map((record) => (
              <article key={record.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{record.title}</h3>
                    {record.status && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{record.status.replaceAll('_', ' ')}</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {record.patient} · {record.provider} · {new Date(record.date).toLocaleString()}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{record.summary || 'No additional details'}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing({ id: record.id, values: { ...record.form } })}
                    aria-label={`Edit ${record.title}`}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isArchiving}
                    onClick={() => archive(record)}
                    aria-label={`Archive ${record.title}`}
                  >
                    <Archive className="mr-2 h-4 w-4" /> Archive
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
