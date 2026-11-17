import { create } from 'zustand';
import {
  ResumeData,
  Personal,
  AddressData,
  Contacts,
  DesignData,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  LangLevel,
  WeaknessItem,
  CoverLetterData,
  RecommendationLetterData,
  AttachedDocumentsData,
  createDefaultResumeData,
} from '@cvb/shared';
import { patchResume } from '../lib/api.js';

let autoSaveTimer: any = null;

interface ResumeState {
  data: ResumeData;
  serverVersion: number;
  saveState: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  lastSavedAt: string | null;
  previewMode: 'desktop' | 'mobile';
  ai: {
    status: 'idle' | 'streaming' | 'error';
    stage?: string;
    error?: string;
  };

  setResume: (data: ResumeData, version: number) => void;
  updatePersonal: (patch: Partial<Personal>) => void;
  updateAddress: (patch: Partial<AddressData>) => void;
  updateContacts: (patch: Partial<Contacts>) => void;
  updateDesign: (patch: Partial<DesignData>) => void;
  setNoExperience: (noExp: boolean) => void;
  setLanguage: (lang: any) => void;

  // Experience
  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  removeExperience: (id: string) => void;
  reorderExperience: (fromIndex: number, toIndex: number) => void;

  // Education
  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;

  // Projects
  addProject: () => void;
  updateProject: (id: string, patch: Partial<ProjectItem>) => void;
  removeProject: (id: string) => void;

  // Skills
  addHardSkill: (name: string, level?: number) => void;
  removeHardSkill: (index: number) => void;
  addSoftSkill: (name: string) => void;
  removeSoftSkill: (index: number) => void;
  addLanguage: (name: string, level: LangLevel) => void;
  removeLanguage: (index: number) => void;

  // AI, Audit & Documents
  setAiSummary: (summary: string) => void;
  setAiStrengths: (strengths: any[]) => void;
  setAiWeaknesses: (weaknesses: WeaknessItem[], completenessScore?: number) => void;
  toggleWeaknessResolved: (id: string) => void;
  setAiStatus: (status: 'idle' | 'streaming' | 'error', stage?: string, error?: string) => void;
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
  updateCoverLetter: (patch: Partial<CoverLetterData>) => void;
  updateRecommendationLetter: (patch: Partial<RecommendationLetterData>) => void;
  setDocuments: (docs: AttachedDocumentsData) => void;

  triggerAutoSave: () => void;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  data: createDefaultResumeData(),
  serverVersion: 1,
  saveState: 'idle',
  lastSavedAt: null,
  previewMode: 'desktop',
  ai: { status: 'idle' },

  setResume: (data, version) => {
    set({ data, serverVersion: version, saveState: 'saved' });
    try {
      localStorage.setItem(`cvb:resume:${data.id}`, JSON.stringify(data));
    } catch {}
  },

  updatePersonal: (patch) => {
    set((state) => ({
      data: {
        ...state.data,
        personal: { ...state.data.personal, ...patch },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  updateAddress: (patch) => {
    set((state) => {
      const prevAddr = state.data.personal.address || {
        country: 'Узбекистан',
        city: state.data.personal.city || '',
        willingToRelocate: false,
        remoteWork: false,
      };
      const nextAddr = { ...prevAddr, ...patch };
      return {
        data: {
          ...state.data,
          personal: {
            ...state.data.personal,
            city: nextAddr.city,
            address: nextAddr,
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
    get().triggerAutoSave();
  },

  updateContacts: (patch) => {
    set((state) => ({
      data: {
        ...state.data,
        contacts: { ...state.data.contacts, ...patch },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  updateDesign: (patch) => {
    set((state) => ({
      data: {
        ...state.data,
        design: { ...state.data.design, ...patch },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  setNoExperience: (noExp) => {
    set((state) => ({
      data: { ...state.data, noExperience: noExp, updatedAt: new Date().toISOString() },
    }));
    get().triggerAutoSave();
  },

  setLanguage: (lang) => {
    set((state) => ({
      data: { ...state.data, language: lang, updatedAt: new Date().toISOString() },
    }));
    get().triggerAutoSave();
  },

  // Experience
  addExperience: () => {
    const newItem: ExperienceItem = {
      id: crypto.randomUUID(),
      company: '',
      role: '',
      startDate: `${new Date().getFullYear()}-01`,
      endDate: null,
      rawDescription: '',
      useAi: true,
    };
    set((state) => ({
      data: {
        ...state.data,
        experience: [newItem, ...(state.data.experience || [])],
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  updateExperience: (id, patch) => {
    set((state) => ({
      data: {
        ...state.data,
        experience: state.data.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  removeExperience: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        experience: state.data.experience.filter((e) => e.id !== id),
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  reorderExperience: (fromIndex, toIndex) => {
    set((state) => {
      const list = [...(state.data.experience || [])];
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) {
        return state;
      }
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      return {
        data: {
          ...state.data,
          experience: list,
          updatedAt: new Date().toISOString(),
        },
      };
    });
    get().triggerAutoSave();
  },

  // Education
  addEducation: () => {
    const newItem: EducationItem = {
      id: crypto.randomUUID(),
      institution: '',
      specialty: '',
      level: 'bachelor',
      graduationYear: new Date().getFullYear(),
    };
    set((state) => ({
      data: {
        ...state.data,
        education: [newItem, ...(state.data.education || [])],
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  updateEducation: (id, patch) => {
    set((state) => ({
      data: {
        ...state.data,
        education: state.data.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  removeEducation: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        education: state.data.education.filter((e) => e.id !== id),
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  // Projects
  addProject: () => {
    const newItem: ProjectItem = {
      id: crypto.randomUUID(),
      name: '',
      link: '',
      rawDescription: '',
      useAi: true,
    };
    set((state) => ({
      data: {
        ...state.data,
        projects: [newItem, ...(state.data.projects || [])],
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  updateProject: (id, patch) => {
    set((state) => ({
      data: {
        ...state.data,
        projects: state.data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  removeProject: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        projects: state.data.projects.filter((p) => p.id !== id),
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  // Skills
  addHardSkill: (name, level) => {
    if (!name.trim()) return;
    set((state) => {
      const existing = state.data.skills?.hard || [];
      if (existing.some((s) => s.name.toLowerCase() === name.toLowerCase().trim())) {
        return state;
      }
      return {
        data: {
          ...state.data,
          skills: {
            ...state.data.skills,
            hard: [...existing, { name: name.trim(), level }],
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
    get().triggerAutoSave();
  },

  removeHardSkill: (index) => {
    set((state) => ({
      data: {
        ...state.data,
        skills: {
          ...state.data.skills,
          hard: state.data.skills.hard.filter((_, idx) => idx !== index),
        },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  addSoftSkill: (name) => {
    if (!name.trim()) return;
    set((state) => {
      const existing = state.data.skills?.soft || [];
      if (existing.some((s) => s.toLowerCase() === name.toLowerCase().trim())) {
        return state;
      }
      return {
        data: {
          ...state.data,
          skills: {
            ...state.data.skills,
            soft: [...existing, name.trim()],
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
    get().triggerAutoSave();
  },

  removeSoftSkill: (index) => {
    set((state) => ({
      data: {
        ...state.data,
        skills: {
          ...state.data.skills,
          soft: state.data.skills.soft.filter((_, idx) => idx !== index),
        },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  addLanguage: (name, level) => {
    if (!name.trim()) return;
    set((state) => ({
      data: {
        ...state.data,
        skills: {
          ...state.data.skills,
          languages: [...(state.data.skills?.languages || []), { name: name.trim(), level }],
        },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  removeLanguage: (index) => {
    set((state) => ({
      data: {
        ...state.data,
        skills: {
          ...state.data.skills,
          languages: state.data.skills.languages.filter((_, idx) => idx !== index),
        },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  // AI, Audit & Documents
  setAiSummary: (summary) => {
    set((state) => ({
      data: {
        ...state.data,
        ai: { ...state.data.ai, summary },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  setAiStrengths: (strengths) => {
    set((state) => ({
      data: {
        ...state.data,
        ai: { ...state.data.ai, strengths },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  setAiWeaknesses: (weaknesses, completenessScore) => {
    set((state) => ({
      data: {
        ...state.data,
        ai: {
          ...state.data.ai,
          weaknesses,
          completenessScore: completenessScore ?? state.data.ai.completenessScore,
        },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  toggleWeaknessResolved: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        ai: {
          ...state.data.ai,
          weaknesses: (state.data.ai.weaknesses || []).map((w) =>
            w.id === id ? { ...w, resolved: !w.resolved } : w
          ),
        },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  setAiStatus: (status, stage, error) => {
    set({ ai: { status, stage, error } });
  },

  setPreviewMode: (mode) => set({ previewMode: mode }),

  updateCoverLetter: (patch) => {
    set((state) => {
      const prev = state.data.documents?.coverLetter || {
        targetCompany: '',
        targetVacancy: '',
        recipientName: '',
        body: '',
        isEnabled: true,
      };
      return {
        data: {
          ...state.data,
          documents: {
            ...(state.data.documents || {}),
            coverLetter: {
              ...prev,
              ...patch,
              updatedAt: new Date().toISOString(),
            },
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
    get().triggerAutoSave();
  },

  updateRecommendationLetter: (patch) => {
    set((state) => {
      const prev = state.data.documents?.recommendationLetter || {
        recommenderName: '',
        recommenderRole: '',
        recommenderCompany: '',
        relationship: 'supervisor' as const,
        body: '',
        isEnabled: true,
      };
      return {
        data: {
          ...state.data,
          documents: {
            ...(state.data.documents || {}),
            recommendationLetter: {
              ...prev,
              ...patch,
              updatedAt: new Date().toISOString(),
            },
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
    get().triggerAutoSave();
  },

  setDocuments: (docs) => {
    set((state) => ({
      data: {
        ...state.data,
        documents: {
          ...(state.data.documents || {}),
          ...docs,
        },
        updatedAt: new Date().toISOString(),
      },
    }));
    get().triggerAutoSave();
  },

  triggerAutoSave: () => {
    const { data, serverVersion } = get();

    try {
      localStorage.setItem(`cvb:resume:${data.id}`, JSON.stringify(data));
    } catch {}

    set({ saveState: 'saving' });

    if (autoSaveTimer) clearTimeout(autoSaveTimer);

    autoSaveTimer = setTimeout(async () => {
      if (!window.navigator.onLine) {
        set({ saveState: 'offline' });
        return;
      }
      try {
        const res = await patchResume(data.id, data, serverVersion);
        set({
          serverVersion: res.version,
          saveState: 'saved',
          lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } catch (e) {
        set({ saveState: 'error' });
      }
    }, 1500);
  },
}));
