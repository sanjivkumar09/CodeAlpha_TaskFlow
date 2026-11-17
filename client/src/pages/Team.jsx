import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  ShieldCheck,
  Shield,
  Trash2,
  Check,
  Copy,
  ExternalLink,
  Search,
} from 'lucide-react';
import { projectApi, userApi } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';

const Team = () => {
  const { user } = useAuth();
  const { projects, selectedProjectId } = useProject();

  const [activeProject, setActiveProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  const targetProjectId = selectedProjectId || (projects[0]?._id || null);

  const loadTeamData = async () => {
    if (!targetProjectId) return;
    try {
      setLoading(true);
      const [membersRes, usersRes] = await Promise.all([
        projectApi.getMembers(targetProjectId),
        userApi.search(''),
      ]);
      setMembers(membersRes.data.members || []);
      setAllUsers(usersRes.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [targetProjectId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviteMsg('');
      const res = await projectApi.inviteMember(targetProjectId, {
        email: inviteEmail.trim(),
        role: inviteRole,
        directAdd: true,
      });

      if (res.data.invitationToken) {
        setInviteLink(`${window.location.origin}/invite/${res.data.invitationToken}`);
      }
      setInviteMsg(res.data.message);
      loadTeamData();
      setInviteEmail('');
    } catch (err) {
      setInviteMsg(err.response?.data?.message || 'Failed to invite member');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await projectApi.updateMemberRole(targetProjectId, userId, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.user._id === userId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Remove this member from the project workspace?')) {
      try {
        await projectApi.removeMember(targetProjectId, userId);
        setMembers((prev) => prev.filter((m) => m.user._id !== userId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentProjectObj = projects.find((p) => p._id === targetProjectId);

  const filteredMembers = members.filter(
    (m) =>
      m.user?.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      m.user?.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Team & Collaborators
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Workspace members for{' '}
            <span className="font-semibold text-slate-200">{currentProjectObj?.name || 'Project'}</span>.
          </p>
        </div>

        <button
          onClick={() => {
            setInviteMsg('');
            setInviteLink('');
            setInviteModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center justify-between gap-4 bg-[#0c1220] p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            placeholder="Search member by name or email..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-brand-500 transition"
          />
        </div>

        <span className="text-xs text-slate-400">
          Showing <strong className="text-slate-200">{filteredMembers.length}</strong> active members
        </span>
      </div>

      {/* Members Directory Table */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Workspace Role</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.map((member) => {
                const isCurrentUser = member.user?._id === user?._id;
                const isAdmin = member.role === 'admin';

                return (
                  <tr key={member.user?._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            member.user?.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user?.name}`
                          }
                          alt={member.user?.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700 bg-slate-800"
                        />
                        <div>
                          <p className="font-semibold text-white flex items-center gap-1.5">
                            <span>{member.user?.name}</span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-400 text-[10px]">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">{member.user?.bio}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-300 font-mono text-[11px]">
                      {member.user?.email}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.user?._id, e.target.value)}
                        disabled={isCurrentUser}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500 disabled:opacity-60"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Project Admin</option>
                      </select>
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Active'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {!isCurrentUser && (
                        <button
                          onClick={() => handleRemoveMember(member.user?._id)}
                          title="Remove from project"
                          className="p-1.5 text-slate-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)} />

          <div className="relative w-full max-w-md bg-[#0e1526] border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-base font-bold text-white">Invite Member to Project</h3>
            <p className="text-xs text-slate-400">
              Enter an email to add existing TaskFlow members directly or generate an invitation link.
            </p>

            {inviteMsg && (
              <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg text-xs text-brand-300">
                {inviteMsg}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@taskflow.dev"
                  required
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                >
                  <option value="member">Member (Can create, view & comment on tasks)</option>
                  <option value="admin">Project Admin (Can manage members & settings)</option>
                </select>
              </div>

              {inviteLink && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Shareable Link:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="w-full text-xs font-mono bg-slate-800 text-slate-200 px-2 py-1 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inviteLink)}
                      className="p-1 text-brand-400 hover:text-white"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
                >
                  Add / Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
