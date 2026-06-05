import { create } from 'zustand';
import type { EventFormTemplate } from '../lib/eventForms';
import { createDefaultEventFormTemplate, parseFormFields } from '../lib/eventForms';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { supabase } from '../lib/supabase/client';

export interface EventFormStore {
  forms: EventFormTemplate[];
  hydrated: boolean;
  hydrateFromRemote: () => Promise<void>;
  addForm: (input?: Partial<Pick<EventFormTemplate, 'name' | 'description' | 'fields'>>) => Promise<EventFormTemplate>;
  updateForm: (id: string, patch: Partial<Pick<EventFormTemplate, 'name' | 'description' | 'fields'>>) => Promise<void>;
  removeForm: (id: string) => Promise<void>;
  getForm: (id: string) => EventFormTemplate | undefined;
}

export const useEventFormStore = create<EventFormStore>()((set, get) => ({
  forms: [],
  hydrated: false,

  hydrateFromRemote: async () => {
    if (!supabase) return;
    try {
      const forms = await orderingRepo.fetchEventForms();
      set({ forms, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addForm: async (input) => {
    const base = createDefaultEventFormTemplate(input?.name ?? 'New registration form');
    const form: EventFormTemplate = {
      ...base,
      id: newId(),
      name: input?.name?.trim() || base.name,
      description: input?.description?.trim() ?? base.description,
      fields: input?.fields ?? base.fields,
      updatedAt: new Date().toISOString(),
    };
    await orderingRepo.upsertEventForm(form);
    set({ forms: [...get().forms, form] });
    return form;
  },

  updateForm: async (id, patch) => {
    const current = get().forms.find((f) => f.id === id);
    if (!current) return;
    const updated: EventFormTemplate = {
      ...current,
      ...patch,
      fields: patch.fields ? parseFormFields(patch.fields) : current.fields,
      updatedAt: new Date().toISOString(),
    };
    await orderingRepo.upsertEventForm(updated);
    set({ forms: get().forms.map((f) => (f.id === id ? updated : f)) });
  },

  removeForm: async (id) => {
    await orderingRepo.deleteEventForm(id);
    set({ forms: get().forms.filter((f) => f.id !== id) });
  },

  getForm: (id) => get().forms.find((f) => f.id === id),
}));
