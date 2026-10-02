import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Project } from '../../content';
import { href, go } from '../router';
import { PATHS, sortProjects, toJSON, useAdmin } from '../store';
import { Button, PageHeader, SaveBar } from '../ui';

function SortableCard({ project, index }: { project: Project; index: number }) {
  const { src } = useAdmin();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.slug });
  const row = Math.floor(index / 2) + 1;
  // Sitede her satırın düzeni değişir: tek satırlarda ilk proje büyük ve solda, çift satırlarda büyük ve sağda
  const big = index % 2 === 0;
  const side = (row % 2 === 1) === big ? 'solda' : 'sağda';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative rounded-2xl border bg-white p-2 transition-shadow ${isDragging ? 'z-10 border-accent shadow-2xl' : 'border-black/[0.06] shadow-sm hover:shadow-md'}`}
    >
      <a href={href('projeler', project.slug)} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-paper">
          {project.cover ? (
            <img src={src(project.cover)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : project.coverVideo ? (
            <video src={src(project.coverVideo)} muted loop playsInline autoPlay className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-sm font-medium text-ink/40">Kapak görseli yok</span>
          )}
          {project.featured && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold backdrop-blur">
              <Star size={12} className="fill-accent-strong text-accent-strong" /> Girişte
            </span>
          )}
        </div>
        <div className="px-2 pb-1 pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate font-display text-lg font-semibold tracking-tight">{project.title || 'Adsız proje'}</h3>
            <span className="text-xs font-medium text-ink/40">{project.year}</span>
          </div>
          <p className="truncate text-sm text-ink/55">{project.discipline?.tr}</p>
          <p className="mt-2 inline-block rounded-md bg-paper px-2 py-1 text-[11px] font-semibold text-ink/60">
            Satır {row} · {big ? 'büyük' : 'küçük'} · {side}
          </p>
        </div>
      </a>
      <button
        type="button"
        aria-label={`${project.title} projesini sürükleyerek taşı`}
        {...attributes}
        {...listeners}
        className="absolute right-3 top-3 grid h-9 w-9 cursor-grab touch-none place-items-center rounded-lg bg-white/90 text-ink/60 shadow backdrop-blur active:cursor-grabbing"
      >
        <GripVertical size={18} />
      </button>
    </div>
  );
}

export default function Projects() {
  const { content, save, saving } = useAdmin();
  const saved = useMemo(() => sortProjects(content.projects).map((p) => p.slug), [content.projects]);
  const [order, setOrder] = useState(saved);
  useEffect(() => setOrder(saved), [saved]);
  const dirty = order.join() !== saved.join();

  const bySlug = useMemo(() => new Map(content.projects.map((p) => [p.slug, p])), [content.projects]);
  const list = order.map((slug) => bySlug.get(slug)).filter(Boolean) as Project[];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setOrder((o) => arrayMove(o, o.indexOf(String(active.id)), o.indexOf(String(over.id))));
  };

  const saveOrder = async () => {
    const updated = list.map((p, i) => ({ ...p, order: i + 1 }));
    const changes = updated.filter((p) => bySlug.get(p.slug)?.order !== p.order).map((p) => ({ path: PATHS.project(p.slug), text: toJSON(p) }));
    await save(changes, 'Panel: proje sırası güncellendi', { projects: updated });
  };

  return (
    <div>
      <PageHeader
        title="Projeler"
        description="Ana sayfada ikişer ikişer satırlara dizilir. Sırayı değiştirmek için kartı sağ üstteki tutamaçtan sürükleyin."
        actions={
          <Button onClick={() => go('projeler', 'yeni')}>
            <Plus size={18} /> Yeni proje
          </Button>
        }
      />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {list.map((p, i) => (
              <SortableCard key={p.slug} project={p} index={i} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {list.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-black/10 p-12 text-center text-ink/50">Henüz proje yok. "Yeni proje" ile ilkini ekleyin.</div>
      )}
      <SaveBar dirty={dirty} saving={saving} onSave={saveOrder} onReset={() => setOrder(saved)} />
    </div>
  );
}
