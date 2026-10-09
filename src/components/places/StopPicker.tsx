'use client';
import { SelectField } from '@/components/ui/Controls';
import { getStop } from '@/data/demo/stops';

export function StopPicker({ stopIds, value, onChange }: { stopIds: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <SelectField label="Cidade ou vila" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">Todas as paradas da viagem</option>
      {stopIds.map((id) => (
        <option key={id} value={id}>
          {getStop(id)?.name ?? id}
        </option>
      ))}
    </SelectField>
  );
}
