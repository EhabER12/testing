"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import RoleBasedGuard from "@/components/auth/RoleBasedGuard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Loader2,
  Trash2,
  Edit,
  UserCheck,
  UserCog,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  Users,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  updateUser,
  approveTeacher,
  rejectTeacher,
} from "@/store/services/userService";
import { resetUserManagementStatus } from "@/store/slices/userSlice";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

// Define roles - adjust based on your actual roles
const ROLES = ["user", "teacher", "moderator", "admin"];

export default function UsersDashboardPage() {
  return (
    <RoleBasedGuard allowedRoles={["admin"]} fallbackUrl="/dashboard">
      <UsersContent />
    </RoleBasedGuard>
  );
}

function UsersContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();
  const {
    users,
    isLoading,
    isError,
    isSuccess,
    message,
    totalPages,
    currentPage,
    totalUsers,
  } = useAppSelector((state) => state.userManagement);

  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectingTeacherId, setRejectingTeacherId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // State for creating new user (Invite)
  const [newUser, setNewUser] = useState({
    email: "",
    role: "user",
  });

  // State for editing user
  const [editingUser, setEditingUser] = useState({
    userId: "",
    name: "",
    email: "",
    role: "user",
    status: "active",
  });

  const fetchUsers = useCallback(
    (pageNum = 1) => {
      setPage(pageNum);
      dispatch(getAllUsers());
    },
    [dispatch]
  );

  useEffect(() => {
    fetchUsers(page);

    return () => {
      dispatch(resetUserManagementStatus());
    };
  }, [dispatch, fetchUsers, page]);

  useEffect(() => {
    if (currentPage && currentPage !== page) {
      setPage(currentPage);
    }
  }, [currentPage]);

  const handlePageChange = (pageNum: number) => {
    if (pageNum > 0 && pageNum <= totalPages) {
      fetchUsers(pageNum);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    if (
      userId &&
      confirm(`Are you sure you want to change this user's role to ${newRole}?`)
    ) {
      dispatch(updateUserRole({ userId, role: newRole }));
    }
  };

  const handleDelete = (userId: string) => {
    if (
      userId &&
      confirm(
        "Are you sure you want to delete this user? This cannot be undone."
      )
    ) {
      dispatch(deleteUser(userId));
    }
  };

  const handleCreateUser = () => {
    if (!newUser.email) {
      alert("Please fill in all required fields");
      return;
    }
    // Dispatch create user with only email and role (Invite flow)
    dispatch(createUser(newUser));
    setIsCreateDialogOpen(false);
    setNewUser({ email: "", role: "user" });
  };

  const openEditDialog = (user: any) => {
    // Helper to safely get name
    let userName = "";
    if (user.name) {
      userName = user.name;
    } else if (user.fullName) {
      if (typeof user.fullName === 'string') {
        userName = user.fullName;
      } else {
        userName = isRtl ? (user.fullName.ar || user.fullName.en || "") : (user.fullName.en || user.fullName.ar || "");
      }
    }

    setEditingUser({
      userId: user.id || user._id || "",
      name: userName,
      email: user.email || "",
      role: user.role || "user",
      status: user.status || "active",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser.userId || !editingUser.email) {
      alert("Please fill in all required fields");
      return;
    }

    // Get the original user to check if role changed
    const originalUser = users.find((u) => (u.id || u._id) === editingUser.userId);

    // Update basic user info
    await dispatch(updateUser(editingUser));

    // If role changed, call the separate role update endpoint
    if (originalUser && originalUser.role !== editingUser.role) {
      await dispatch(
        updateUserRole({ userId: editingUser.userId, role: editingUser.role })
      );
    }

    setIsEditDialogOpen(false);
  };

  const handleApproveTeacher = (userId: string) => {
    if (
      userId &&
      confirm("Are you sure you want to approve this teacher? They will be able to access the dashboard.")
    ) {
      dispatch(approveTeacher(userId));
    }
  };

  const openRejectDialog = (userId: string) => {
    setRejectingTeacherId(userId);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleRejectTeacher = () => {
    if (rejectingTeacherId) {
      dispatch(
        rejectTeacher({
          userId: rejectingTeacherId,
          reason: rejectionReason,
          sendEmail: true,
        })
      );
      setIsRejectDialogOpen(false);
      setRejectingTeacherId("");
      setRejectionReason("");
    }
  };

  const retryFetch = () => {
    fetchUsers(page);
  };

  const getRoleIcon = (role: string | undefined) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return <ShieldCheck className="mr-1 h-3 w-3" />;
      case "moderator":
        return <UserCog className="mr-1 h-3 w-3" />;
      case "teacher":
        return <Users className="mr-1 h-3 w-3" />;
      case "user":
      default:
        return <UserCheck className="mr-1 h-3 w-3" />;
    }
  };

  // Render Loading State
  if (isLoading && users.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className={`mb-6 flex items-center justify-between`}>
        <div>
          <h1 className="text-2xl font-bold">{t("admin.users.manageUsers")}</h1>
          <div className="text-sm text-gray-500">
            {t("admin.users.totalUsers").replace("{count}", String(totalUsers))}
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {t("admin.users.inviteUser")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[425px]"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <DialogHeader className={`sm:text-start`}>
              <DialogTitle>{t("admin.users.inviteNewUser")}</DialogTitle>
              <DialogDescription>
                {t("admin.users.inviteDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("admin.users.email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">{t("admin.users.role")}</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      {t("admin.users.user")}
                    </SelectItem>
                    <SelectItem value="teacher">
                      {t("admin.users.teacher")}
                    </SelectItem>
                    <SelectItem value="moderator">
                      {t("admin.users.moderator")}
                    </SelectItem>
                    <SelectItem value="admin">
                      {t("admin.users.admin")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 justify-start">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                {t("admin.common.cancel")}
              </Button>
              <Button onClick={handleCreateUser} disabled={isLoading}>
                {isLoading && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                {t("admin.users.sendInvitation")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-start">
                {t("admin.users.editUser")}
              </DialogTitle>
              <DialogDescription className="text-start">
                {t("admin.users.updateUserDetails")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t("admin.users.name")}</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">{t("admin.users.email")} *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">{t("admin.users.role")}</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, role: value })
                  }
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  <SelectTrigger id="edit-role" dir={isRtl ? "rtl" : "ltr"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                    <SelectItem value="user">
                      {t("admin.users.user")}
                    </SelectItem>
                    <SelectItem value="teacher">
                      {t("admin.users.teacher")}
                    </SelectItem>
                    <SelectItem value="moderator">
                      {t("admin.users.moderator")}
                    </SelectItem>
                    <SelectItem value="admin">
                      {t("admin.users.admin")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">{t("admin.users.status")}</Label>
                <Select
                  value={editingUser.status}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, status: value })
                  }
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  <SelectTrigger id="edit-status" dir={isRtl ? "rtl" : "ltr"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
            <DialogFooter className="gap-2 justify-start">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                {t("admin.common.cancel")}
              </Button>
              <Button onClick={handleUpdateUser} disabled={isLoading}>
                {isLoading && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                {t("admin.users.update")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Teacher Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.teachers.rejectTeacher")}</DialogTitle>
              <DialogDescription>
                {t("admin.teachers.rejectConfirm")}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reject-reason">{t("admin.teachers.rejectionReason")}</Label>
              <Input
                id="reject-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t("admin.teachers.reasonPlaceholder")}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                {t("admin.common.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleRejectTeacher}>
                {t("admin.common.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {isSuccess && message && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.users.name")}</TableHead>
              <TableHead>{t("admin.users.email")}</TableHead>
              <TableHead>{t("admin.users.role")}</TableHead>
              <TableHead>{t("admin.users.status")}</TableHead>
              <TableHead className="text-end">{t("admin.users.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("admin.users.noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id || user._id}>
                  <TableCell className="font-medium">
                    {(() => {
                      if (user.name) return user.name;
                      if (user.fullName) {
                        if (typeof user.fullName === 'string') return user.fullName;
                        return isRtl ? (user.fullName.ar || user.fullName.en) : (user.fullName.en || user.fullName.ar);
                      }
                      return "N/A";
                    })()}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Badge variant="outline" className="flex gap-1 items-center">
                        {getRoleIcon(user.role)}
                        {user.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "active"
                          ? "default" // was "success" but not in standard UI
                          : user.status === "invited"
                            ? "secondary"
                            : "destructive"
                      }
                      className={user.status === "active" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {user.status || "active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      {user.role === "teacher" && !user.teacherInfo?.isApproved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApproveTeacher(user.id || user._id || "")}
                          title={t("admin.teachers.approve")}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span className="sr-only">Approve</span>
                        </Button>
                      )}

                      {user.role === "teacher" && !user.teacherInfo?.isApproved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => openRejectDialog(user.id || user._id || "")}
                          title={t("admin.teachers.reject")}
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="sr-only">Reject</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => handleDelete(user.id || user._id || "")}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={page === p}
                  onClick={() => handlePageChange(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
