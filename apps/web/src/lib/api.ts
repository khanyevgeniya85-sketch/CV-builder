import {
  ResumeData,
  CheckIssue,
  Lang,
  ExportFormat,
  WeaknessItem,
  AttachedDocumentsData,
  CoverLetterData,
  RecommendationLetterData,
  RecommendationRelationship,
} from '@cvb/shared';

const API_BASE = '/api/v1';

export async function initSession(): Promise<{ sessionId: string }> {
  const res = await fetch(`${API_BASE}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'cvb' },
    body: JSON.stringify({}),
  });
  return res.json();
}

export async function fetchResumesList(): Promise<Array<{ id: string; title: string; updatedAt: string; templateId: string }>> {
  const res = await fetch(`${API_BASE}/resumes`, {
    headers: { 'X-Requested-With': 'cvb' },
  });
  if (!res.ok) throw new Error('Failed to fetch resumes');
  return res.json();
}

export async function fetchResume(id: string): Promise<{ id: string; version: number; data: ResumeData; photoUrl?: string }> {
  const res = await fetch(`${API_BASE}/resumes/${id}`, {
    headers: { 'X-Requested-With': 'cvb' },
  });
  if (!res.ok) throw new Error('Failed to fetch resume');
  return res.json();
}

export async function createNewResume(language: Lang = 'ru'): Promise<{ id: string; version: number; data: ResumeData }> {
  const res = await fetch(`${API_BASE}/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'cvb' },
    body: JSON.stringify({ language }),
  });
  if (!res.ok) throw new Error('Failed to create resume');
  return res.json();
}

export async function patchResume(
  id: string,
  patch: Partial<ResumeData>,
  version: number
): Promise<{ version: number; conflict?: boolean; currentData?: ResumeData }> {
  const res = await fetch(`${API_BASE}/resumes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'cvb' },
    body: JSON.stringify({ version, patch }),
  });

  if (res.status === 409) {
    const errorJson = await res.json();
    return {
      version: errorJson.error.currentVersion,
      conflict: true,
      currentData: errorJson.error.currentData,
    };
  }

  if (!res.ok) throw new Error('Failed to update resume');
  return res.json();
}

export async function deleteResume(id: string): Promise<void> {
  await fetch(`${API_BASE}/resumes/${id}`, {
    method: 'DELETE',
    headers: { 'X-Requested-With': 'cvb' },
  });
}

export async function duplicateResume(id: string): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/resumes/${id}/duplicate`, {
    method: 'POST',
    headers: { 'X-Requested-With': 'cvb' },
  });
  return res.json();
}

export async function uploadResumePhoto(id: string, dataUrl: string): Promise<{ photoUrl: string }> {
  const res = await fetch(`${API_BASE}/resumes/${id}/photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'cvb' },
    body: JSON.stringify({ dataUrl }),
  });
  if (!res.ok) throw new Error('Photo upload failed');
  return res.json();
}

export async function deleteResumePhoto(id: string): Promise<void> {
  await fetch(`${API_BASE}/resumes/${id}/photo`, {
    method: 'DELETE',
    headers: { 'X-Requested-With': 'cvb' },
  });
}

export async function checkResumeCompletenessApi(id: string): Promise<{ issues: CheckIssue[] }> {
  const res = await fetch(`${API_BASE}/resumes/${id}/ai/check`, {
    method: 'POST',
    headers: { 'X-Requested-With': 'cvb' },
  });
  if (!res.ok) return { issues: [] };
  return res.json();
}

export async function getAiUsageApi(id: string): Promise<{ used: number; limit: number; resetsAt: string }> {
  const res = await fetch(`${API_BASE}/resumes/${id}/ai/usage`, {
    headers: { 'X-Requested-With': 'cvb' },
  });
  if (!res.ok) return { used: 0, limit: 20, resetsAt: '' };
  return res.json();
}

export async function generateCoverLetterApi(
  id: string,
  params: { targetCompany?: string; targetVacancy?: string; recipientName?: string }
): Promise<{ coverLetter: CoverLetterData }> {
  const res = await fetch(`${API_BASE}/resumes/${id}/ai/cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'cvb' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Cover letter generation failed');
  return res.json();
}

export async function generateRecommendationLetterApi(
  id: string,
  params: {
    recommenderName?: string;
    recommenderRole?: string;
    recommenderCompany?: string;
    relationship?: RecommendationRelationship;
  }
): Promise<{ recommendationLetter: RecommendationLetterData }> {
  const res = await fetch(`${API_BASE}/resumes/${id}/ai/recommendation-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'cvb' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Recommendation letter generation failed');
  return res.json();
}

export function subscribeAiGeneration(
  id: string,
  options: { tone?: string; language?: string },
  callbacks: {
    onStage?: (stage: string) => void;
    onSkills?: (data: any) => void;
    onSummary?: (text: string) => void;
    onExperience?: (data: any) => void;
    onProjects?: (data: any) => void;
    onStrengths?: (data: any) => void;
    onWeaknesses?: (data: { items: WeaknessItem[]; completenessScore: number }) => void;
    onDocuments?: (docs: AttachedDocumentsData) => void;
    onDone?: (data: any) => void;
    onError?: (err: any) => void;
  }
) {
  const controller = new AbortController();

  fetch(`${API_BASE}/resumes/${id}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'cvb' },
    body: JSON.stringify(options),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          let eventType = 'message';
          let eventData = '';

          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6).trim();
            }
          }

          if (eventData) {
            try {
              const parsed = JSON.parse(eventData);
              if (eventType === 'stage') callbacks.onStage?.(parsed.stage);
              else if (eventType === 'skills') callbacks.onSkills?.(parsed);
              else if (eventType === 'summary') callbacks.onSummary?.(parsed.text);
              else if (eventType === 'experience') callbacks.onExperience?.(parsed);
              else if (eventType === 'projects') callbacks.onProjects?.(parsed);
              else if (eventType === 'strengths') callbacks.onStrengths?.(parsed.items);
              else if (eventType === 'weaknesses') callbacks.onWeaknesses?.(parsed);
              else if (eventType === 'documents') callbacks.onDocuments?.(parsed);
              else if (eventType === 'done') callbacks.onDone?.(parsed);
              else if (eventType === 'error') callbacks.onError?.(parsed);
            } catch (e) {
              console.error('Error parsing SSE event:', e);
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        callbacks.onError?.({ code: 'NETWORK_ERROR', message: err.message });
      }
    });

  return () => controller.abort();
}

export async function requestExport(
  id: string,
  format: ExportFormat
): Promise<{ exportId: string }> {
  const res = await fetch(`${API_BASE}/resumes/${id}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'cvb' },
    body: JSON.stringify({ format }),
  });
  return res.json();
}

export async function pollExportStatus(exportId: string): Promise<{
  id: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  url?: string;
  fileName?: string;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/exports/${exportId}`, {
    headers: { 'X-Requested-With': 'cvb' },
  });
  return res.json();
}
