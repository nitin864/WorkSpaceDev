import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../configs/api.js";

export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  async ({ getToken }, { rejectWithValue }) => {
    try {
      const token = await getToken({ template: "integration_firebase" }) || await getToken();

      const { data } = await api.get("/api/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

export const {
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
