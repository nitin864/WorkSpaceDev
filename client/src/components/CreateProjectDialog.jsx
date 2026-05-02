import { useState, useEffect } from "react";
import { XIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import api from "../configs/api";
import { useAuth } from "@clerk/clerk-react";
import { addProject } from "../features/workspaceSlice"; // ✅ FIXED

const CreateProjectDialog = ({ isDialogOpen, setIsDialogOpen }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const { currentWorkspace } = useSelector((state) => state.workspace);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: "",
        end_date: "",
        team_members: [],
        team_lead: "",
        progress: 0,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ FIXED dependency + safe logic
    useEffect(() => {
        if (!currentWorkspace?.members?.length) return;

        const admin = currentWorkspace.members.find(
            (m) => m.role === "ADMIN" && m.user?.email
        );

        if (admin) {
            setFormData((prev) => {
                if (prev.team_lead) return prev;
                return {
                    ...prev,
                    team_lead: admin.user.email,
                    team_members: [admin.user.email],
                };
            });
        }
    }, [currentWorkspace]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.team_lead) {
            return toast.error("Please select project lead");
        }

        try {
            setIsSubmitting(true);

            const { data } = await api.post(
                "/api/projects",
                {
                    workspaceId: currentWorkspace.id,
                    ...formData,
                },
                {
                    headers: {
                        Authorization: `Bearer ${await getToken()}`,
                    },
                }
            );

            dispatch(addProject(data.project)); // ✅ FIXED
            toast.success("Project created successfully!");
            setIsDialogOpen(false);

            // reset
            setFormData({
                name: "",
                description: "",
                status: "PLANNING",
                priority: "MEDIUM",
                start_date: "",
                end_date: "",
                team_members: [],
                team_lead: "",
                progress: 0,
            });
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ❌ prevent removing team lead
    const removeTeamMember = (email) => {
        if (email === formData.team_lead) {
            return toast.error("Cannot remove project lead");
        }

        setFormData((prev) => ({
            ...prev,
            team_members: prev.team_members.filter((m) => m !== email),
        }));
    };

    if (!isDialogOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setIsDialogOpen(false)} // ✅ close on outside click
        >
            <div
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-lg relative shadow-xl"
                onClick={(e) => e.stopPropagation()} // ✅ prevent close inside
            >
                {/* Close */}
                <button
                    className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-800"
                    onClick={() => setIsDialogOpen(false)}
                >
                    <XIcon className="size-5" />
                </button>

                <h2 className="text-xl font-semibold mb-1">
                    Create New Project
                </h2>

                <p className="text-sm text-zinc-500 mb-4">
                    {currentWorkspace?.name}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <input
                        type="text"
                        placeholder="Project name"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded bg-transparent"
                        required
                    />

                    {/* Description */}
                    <textarea
                        placeholder="Description"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                description: e.target.value,
                            })
                        }
                        className="w-full px-3 py-2 border rounded bg-transparent h-20"
                    />

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    start_date: e.target.value,
                                })
                            }
                            className="px-3 py-2 border rounded"
                        />

                        <input
                            type="date"
                            value={formData.end_date}
                            min={formData.start_date}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    end_date: e.target.value,
                                })
                            }
                            className="px-3 py-2 border rounded"
                        />
                    </div>

                    {/* Lead */}
                    <select
                        value={formData.team_lead}
                        onChange={(e) => {
                            const email = e.target.value;

                            setFormData((prev) => ({
                                ...prev,
                                team_lead: email,
                                team_members: [
                                    ...new Set([...prev.team_members, email]),
                                ],
                            }));
                        }}
                        className="w-full px-3 py-2 border rounded"
                    >
                        <option value="">Select project lead</option>
                        {currentWorkspace?.members?.map((m) => (
                            <option key={m.id} value={m.user?.email}>
                                {m.user?.email}
                            </option>
                        ))}
                    </select>

                    {/* Members */}
                    <select
                        onChange={(e) => {
                            const email = e.target.value;
                            if (!email) return;

                            setFormData((prev) => ({
                                ...prev,
                                team_members: [...prev.team_members, email],
                            }));

                            e.target.value = ""; // ✅ reset dropdown
                        }}
                        className="w-full px-3 py-2 border rounded"
                    >
                        <option value="">Add team member</option>
                        {currentWorkspace?.members
                            ?.filter(
                                (m) =>
                                    m.user?.email &&
                                    !formData.team_members.includes(
                                        m.user.email
                                    )
                            )
                            .map((m) => (
                                <option key={m.id} value={m.user.email}>
                                    {m.user.email}
                                </option>
                            ))}
                    </select>

                    {/* Selected members */}
                    <div className="flex flex-wrap gap-2">
                        {formData.team_members.map((email) => (
                            <div
                                key={email}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm"
                            >
                                {email}
                                <button
                                    type="button"
                                    onClick={() => removeTeamMember(email)}
                                >
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsDialogOpen(false)}
                            className="px-4 py-2 border rounded"
                        >
                            Cancel
                        </button>

                        <button
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                        >
                            {isSubmitting ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectDialog;