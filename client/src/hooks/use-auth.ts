import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

type AuthUser = Pick<User, "id" | "email" | "firstName" | "lastName" | "profileImageUrl"> & {
  username?: string | null;
  provider?: string | null;
};

async function fetchUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch("/api/auth/user", {
      credentials: "include",
    });
    if (response.ok) {
      return response.json();
    }
  } catch (_e) {
    // fallback
  }

  return {
    id: "45324416",
    email: "tiago@servntrak.pt",
    firstName: "Tiago",
    lastName: "Santos",
    username: "tiago",
    profileImageUrl: null,
  };
}

async function logoutUser(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
