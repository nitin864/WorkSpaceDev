import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../configs/api.js";

/* =========================
   FETCH WORKSPACES
========================= */
export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  async ({ getToken }, { rejectWithValue }) => {
    try {
      const token =
        (await getToken({ template: "integration_firebase" })) ||
        (await getToken());

      const { data } = await api.get("/api/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // backend returns { workspaces: [...] }
      return data.workspaces || [];
    } catch (error) {
      console.error("fetchWorkspaces error:", error);
      return rejectWithValue([]);
    }
  }
);

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    /* =========================
       WORKSPACE CRUD
    ========================= */
    setWorkspaces: (state, action) => {
      state.workspaces = action.payload;
    },

    setCurrentWorkspace: (state, action) => {
      localStorage.setItem("currentWorkspaceId", action.payload);
      state.currentWorkspace = state.workspaces.find(
        (w) => w.id === action.payload
      );
    },

    addWorkspace: (state, action) => {
      state.workspaces.push(action.payload);
      state.currentWorkspace = action.payload;
    },

    updateWorkspace: (state, action) => {
      state.workspaces = state.workspaces.map((w) =>
        w.id === action.payload.id ? action.payload : w
      );

      if (state.currentWorkspace?.id === action.payload.id) {
        state.currentWorkspace = action.payload;
      }
    },

    deleteWorkspace: (state, action) => {
      state.workspaces = state.workspaces.filter(
        (w) => w.id !== action.payload
      );
    },

    /* =========================
       PROJECT / TASK LOGIC
    ========================= */

    addTask: (state, action) => {
      const { projectId } = action.payload;

      if (!state.currentWorkspace) return;

      state.currentWorkspace.projects = state.currentWorkspace.projects.map(
        (p) =>
          p.id === projectId
            ? { ...p, tasks: [...p.tasks, action.payload] }
            : p
      );
    },

    updateTask: (state, action) => {
      const { projectId, id } = action.payload;

      if (!state.currentWorkspace) return;

      state.currentWorkspace.projects = state.currentWorkspace.projects.map(
        (p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === id ? action.payload : t
                ),
              }
            : p
      );
    },

    deleteTask: (state, action) => {
      const { projectId, taskId } = action.payload;

      if (!state.currentWorkspace) return;

      state.currentWorkspace.projects = state.currentWorkspace.projects.map(
        (p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.filter((t) => t.id !== taskId),
              }
            : p
      );
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.workspaces = action.payload;
        state.loading = false;

        if (action.payload.length > 0) {
          const savedId = localStorage.getItem("currentWorkspaceId");
          const found = action.payload.find((w) => w.id === savedId);
          state.currentWorkspace = found || action.payload[0];
        }
      })
      .addCase(fetchWorkspaces.rejected, (state) => {
        state.loading = false;
      });
  },
});

/* =========================
   EXPORTS (IMPORTANT)
========================= */
export const {
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addTask,
  updateTask,
  deleteTask,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
