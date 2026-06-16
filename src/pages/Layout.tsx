import { useState } from 'react';
import { SHELL_DB } from '../shellDatabase';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useStore } from '../store';
import type { Boat, Slot } from '../types';

// ── Colours ──────────────────────────────────────────────────────────────────
const TIER_COLORS = ['#dbeafe', '#e0f2fe', '#d1fae5', '#fef9c3', '#fde8d8', '#f3e8ff'];
const TIER_BORDER = ['#93c5fd', '#7dd3fc', '#6ee7b7', '#fde047', '#fdba74', '#d8b4fe'];

// ── Fit checker ───────────────────────────────────────────────────────────────
function fits(boat: Boat, slot: Slot) {
  return (
    boat.lengthM <= slot.maxLengthM &&
    boat.widthM  <= slot.maxWidthM  &&
    boat.weightKg <= slot.maxWeightKg
  );
}

// ── Small boat card ───────────────────────────────────────────────────────────
function BoatPill({ boat, small }: { boat: Boat; small?: boolean }) {
  return (
    <div style={{
      background: '#1d4ed8', color: 'white', borderRadius: 6,
      padding: small ? '3px 6px' : '5px 8px',
      fontSize: small ? 10 : 12, fontWeight: 600, lineHeight: 1.3,
      cursor: 'grab', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      <div style={{ fontSize: small ? 9 : 10, opacity: 0.8 }}>{boat.boatClass}</div>
      {boat.name}
    </div>
  );
}

// ── Draggable boat pill ────────────────────────────────────────────────────────
function DraggableBoat({ boat, small }: { boat: Boat; small?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: boat.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ opacity: isDragging ? 0.3 : 1 }}>
      <BoatPill boat={boat} small={small} />
    </div>
  );
}

// ── Droppable slot ─────────────────────────────────────────────────────────────
function SlotCell({
  slot, boat, tierIdx, slotIdx, activeBoat,
}: {
  slot: Slot; boat: Boat | undefined; tierIdx: number; slotIdx: number; activeBoat: Boat | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: slot.id });
  const { assign } = useStore();

  const canFit = activeBoat ? fits(activeBoat, slot) : true;
  const highlight = isOver && activeBoat;
  const bg = highlight
    ? canFit ? '#bbf7d0' : '#fecaca'
    : boat ? TIER_COLORS[tierIdx % TIER_COLORS.length] : 'white';

  const border = highlight
    ? canFit ? '2px solid #16a34a' : '2px solid #dc2626'
    : boat
      ? `2px solid ${TIER_BORDER[tierIdx % TIER_BORDER.length]}`
      : '2px dashed #cbd5e1';

  return (
    <div
      ref={setNodeRef}
      style={{
        background: bg, border, borderRadius: 8,
        padding: '6px', minHeight: 56,
        display: 'flex', flexDirection: 'column', gap: 4,
        position: 'relative', transition: 'background 0.15s',
      }}
    >
      <div style={{ fontSize: 9, color: '#94a3b8', position: 'absolute', top: 3, right: 5 }}>
        {slotIdx + 1}
      </div>
      {boat && (
        <>
          <DraggableBoat boat={boat} small />
          <button
            onClick={() => assign(slot.id, null)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, color: '#94a3b8', padding: 0, alignSelf: 'flex-start',
            }}
          >
            remove
          </button>
        </>
      )}
    </div>
  );
}

// ── Droppable boathouse zone ──────────────────────────────────────────────────
function Boathouse({ boats, isOver }: { boats: Boat[]; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: 'boathouse' });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 52, borderRadius: 8, padding: 8,
        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'flex-start',
        background: isOver ? '#eff6ff' : 'white',
        border: isOver ? '2px solid #93c5fd' : '2px dashed #cbd5e1',
        transition: 'background 0.15s, border 0.15s',
      }}
    >
      {boats.map((boat) => (
        <DraggableBoat key={boat.id} boat={boat} />
      ))}
      {boats.length === 0 && (
        <span style={{ fontSize: 12, color: '#94a3b8' }}>No boats in boathouse</span>
      )}
    </div>
  );
}

// ── Main Layout page ──────────────────────────────────────────────────────────
export default function Layout() {
  const { trailer, stagingSlots, boats, assignment, assign, clearAssignment, autoLayout, addBoat } = useStore();

  function populateBoathouse() {
    const usable = SHELL_DB.filter(s => s.lengthM && s.widthM);
    const shuffled = [...usable].sort(() => Math.random() - 0.5).slice(0, 10);
    shuffled.forEach(s => addBoat({
      name: `${s.manufacturer} ${s.modelName}`,
      manufacturer: s.manufacturer,
      boatClass: s.boatClass.split('/')[0],
      lengthM: s.lengthM,
      widthM: s.widthM ?? 0.32,
      weightKg: s.hullWeightKg ?? 50,
    }));
  }
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overBoathouse, setOverBoathouse] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const boatById = Object.fromEntries(boats.map((b) => [b.id, b]));
  const activeBoat = activeId ? boatById[activeId] ?? null : null;

  // Boats currently on the staging rack
  const stagingBoatIds = new Set(stagingSlots.map(s => assignment[s.id]).filter(Boolean));
  const boathouseBoats = boats.filter(b => stagingBoatIds.has(b.id));

  const tierNames = ['Top', 'Upper-Mid', 'Lower-Mid', 'Bottom', 'Fifth', 'Sixth'];

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setOverBoathouse(false);
    if (!over) return;
    const boatId = String(active.id);
    const boat   = boatById[boatId];
    if (!boat) return;

    if (over.id === 'boathouse') {
      // Move to first available staging slot
      const occupiedSlots = new Set(Object.keys(assignment));
      const slot = stagingSlots.find(s => !occupiedSlots.has(s.id) || assignment[s.id] === boatId);
      if (slot) assign(slot.id, boatId);
      return;
    }

    const slotId = String(over.id);
    const slot   = trailer.slots.find((s) => s.id === slotId);
    if (slot && fits(boat, slot)) assign(slotId, boatId);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={({ over }) => setOverBoathouse(over?.id === 'boathouse')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

        {/* Action bar */}
        <div style={{ padding: '10px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
          <button
            onClick={autoLayout}
            style={{ flex: 1, padding: '8px 12px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            ✨ Auto-Arrange
          </button>
          <button
            onClick={populateBoathouse}
            style={{ padding: '8px 12px', background: 'white', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            + 10 Random
          </button>
          <button
            onClick={clearAssignment}
            style={{ padding: '8px 12px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>

        {/* Trailer grid + Boathouse */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {boats.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: 32 }}>
              Add boats in the Boats tab first.
            </p>
          )}

          {Array.from({ length: trailer.tiers }).map((_, t) => {
            const tierSlots = trailer.slots
              .filter(s => s.tier === t && !s.slung)
              .sort((a, b) => a.position - b.position);
            const slingSlots = trailer.slots
              .filter(s => s.tier === t && s.slung)
              .sort((a, b) => a.position - b.position);
            return (
              <div key={t}>
                {/* Normal tier row */}
                <div style={{ marginBottom: slingSlots.length ? 6 : 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {tierNames[t] ?? `Tier ${t + 1}`}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${trailer.slotsPerTier}, 1fr)`, gap: 6 }}>
                    {tierSlots.map((slot, i) => {
                      const boat = assignment[slot.id] ? boatById[assignment[slot.id]] : undefined;
                      return (
                        <SlotCell key={slot.id} slot={slot} boat={boat} tierIdx={t} slotIdx={i} activeBoat={activeBoat} />
                      );
                    })}
                  </div>
                </div>

                {/* Sling bay between this tier and the next */}
                {slingSlots.length > 0 && (
                  <div style={{ marginBottom: 14, paddingLeft: 10, borderLeft: '3px solid #818cf8' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ↓ Sling — below {tierNames[t] ?? `Tier ${t + 1}`}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${trailer.slotsPerTier - 1}, 1fr)`, gap: 6 }}>
                      {slingSlots.map((slot, i) => {
                        const boat = assignment[slot.id] ? boatById[assignment[slot.id]] : undefined;
                        return (
                          <SlotCell key={slot.id} slot={slot} boat={boat} tierIdx={t} slotIdx={i} activeBoat={activeBoat} />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Boathouse — boats on the staging rack */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Boathouse ({boathouseBoats.length})
            </div>
            <Boathouse boats={boathouseBoats} isOver={overBoathouse} />
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeBoat && <BoatPill boat={activeBoat} />}
      </DragOverlay>
    </DndContext>
  );
}
