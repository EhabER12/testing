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
    setEditingUser({
      userId: user._id,
      name: user.name || "",
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
    const originalUser = users.find((u) => u._id === editingUser.userId);

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
                >
                  <SelectTrigger id="edit-status" dir={isRtl ? "rtl" : "ltr"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className="text-start"
                    dir={isRtl ? "rtl" : "ltr"}
                  >
                    <SelectItem value="active" className="text-start">
                      {t("admin.users.active")}
                    </SelectItem>
                    <SelectItem value="inactive">
                      {t("admin.users.inactive")}
                    </SelectItem>
                    <SelectItem value="invited">
                      {t("admin.users.invited")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter
              dir={isRtl ? "rtl" : "ltr"}
              className="flex !justify-start"
            >
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <div></div>
              <Button onClick={handleUpdateUser} disabled={isLoading}>
                {isLoading && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                {t("common.update")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Teacher Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent className="sm:max-w-[425px]" dir={isRtl ? "rtl" : "ltr"}>
            <DialogHeader className={`sm:text-start`}>
              <DialogTitle>Reject Teacher</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this teacher application (optional).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rejection-reason">Reason (Optional)</Label>
                <textarea
                  id="rejection-reason"
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Incomplete credentials, not qualified..."
                />
              </div>
            </div>
            <DialogFooter className="gap-2 justify-start">
              <Button
                variant="outline"
                onClick={() => setIsRejectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectTeacher}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                Reject Teacher
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error State */}
      {isError && message && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {message || "Failed to load users."}
            <Button
              variant="ghost"
              size="sm"
              onClick={retryFetch}
              disabled={isLoading}
              className="ml-2 h-auto p-1 text-xs"
            >
              {isLoading ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : null}
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success State (e.g., after update/delete) */}
      {isSuccess && message && (
        <Alert
          variant="default"
          className="mb-4 border-green-200 bg-green-50 text-green-800"
        >
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !isError && users.length === 0 && (
        <div className="rounded-lg bg-white/50 p-6 text-center">
          <p className="text-gray-500">{t("admin.users.noUsersFound")}</p>
        </div>
      )}

      {/* Table and Pagination */}
      {users.length > 0 && (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow dir={isRtl ? "rtl" : "ltr"}>
                  <TableHead className={`text-${isRtl ? "right" : "left"}`}>
                    {t("admin.users.name")}
                  </TableHead>
                  <TableHead className={`text-${isRtl ? "right" : "left"}`}>
                    {t("admin.users.email")}
                  </TableHead>
                  <TableHead className={`text-${isRtl ? "right" : "left"}`}>
                    {t("admin.users.role")}
                  </TableHead>
                  <TableHead className={`text-${isRtl ? "right" : "left"}`}>
                    {t("admin.users.status")}
                  </TableHead>
                  <TableHead className={`text-${isRtl ? "right" : "left"}`}>
                    {t("admin.users.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && users.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader2 className="inline-block h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">
                        {user.name ?? "N/A"}
                      </TableCell>
                      <TableCell>{user.email ?? "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleIcon(user.role)} {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "active" ? "default" : "secondary"
                          }
                          className="capitalize"
                        >
                          {user.status || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Teacher approval buttons */}
                          {user.role === "teacher" && (
                            <div key={`teacher-actions-${user._id}`}>
                              {!user.teacherInfo?.isApproved && (
                                <div key={`teacher-pending-${user._id}`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Approve Teacher"
                                    className="text-green-600 hover:bg-green-50 hover:text-green-700"
                                    onClick={() => user._id && handleApproveTeacher(user._id)}
                                    disabled={isLoading || !user._id}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="sr-only">Approve</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Reject Teacher"
                                    className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                    onClick={() => user._id && openRejectDialog(user._id)}
                                    disabled={isLoading || !user._id}
                                  >
                                    <XCircle className="h-4 w-4" />
                                    <span className="sr-only">Reject</span>
                                  </Button>
                                </div>
                              )}
                              {user.teacherInfo?.isApproved && (
                                <Badge
                                  variant="default"
                                  className="bg-green-500 hover:bg-green-600 mr-2"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete User"
                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => user._id && handleDelete(user._id)}
                            disabled={isLoading || !user._id}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }
                    aria-disabled={currentPage === 1}
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink
                      onClick={() => handlePageChange(i + 1)}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }
                    aria-disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}

function getRoleBadgeVariant(
  role: string | undefined
): "default" | "secondary" | "destructive" | "outline" {
  switch (role?.toLowerCase()) {
    case "admin":
      return "destructive";
    case "moderator":
      return "default";
    case "teacher":
      return "outline";
    case "user":
    default:
      return "secondary";
  }
}
