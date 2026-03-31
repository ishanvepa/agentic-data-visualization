import { create } from 'zustand';

const useStore = create((set) => ({
  // Upload state
  status: 'idle', // 'idle' | 'uploading' | 'streaming' | 'done' | 'error'
  taskId: null,
  filename: null,
  rowCount: null,
  colCount: null,

  // Agent stream state
  agentSteps: [],
  charts: [],
  errorMsg: null,

  // Actions
  setUploadResult: (taskId, filename, rows, columns) =>
    set({ taskId, filename, rowCount: rows, colCount: columns, status: 'streaming', agentSteps: [], charts: [] }),

  addStep: (text) =>
    set((state) => ({ agentSteps: [...state.agentSteps, text] })),

  setCharts: (charts) =>
    set({ charts }),

  setDone: () =>
    set({ status: 'done' }),

  setError: (msg) =>
    set({ status: 'error', errorMsg: msg }),

  setUploading: () =>
    set({ status: 'uploading' }),

  reset: () =>
    set({
      status: 'idle',
      taskId: null,
      filename: null,
      rowCount: null,
      colCount: null,
      agentSteps: [],
      charts: [],
      errorMsg: null,
    }),
}));

export default useStore;
