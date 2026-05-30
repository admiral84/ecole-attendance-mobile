import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // Only clear session if there's a specific invalid refresh token error
        if (error) {
          // Check if it's the invalid refresh token error
          if (
            error.message?.includes("Invalid Refresh Token") ||
            error.status === 400
          ) {
            console.log("Invalid refresh token detected, clearing session");
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
          } else {
            // Other errors, just log them
            console.error("Session retrieval error:", error);
          }
        } else if (session?.user) {
          // Valid session exists
          setSession(session);
          await fetchUser(session.user.id);
        }
      } catch (error) {
        console.error("Error getting session:", error);
        // Don't automatically clear on all errors
        if (error.message?.includes("Refresh Token Not Found")) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (session?.user) {
          await fetchUser(session.user.id);
        } else {
          setUser(null);
        }
        setLoading(false);
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        setUser(data);
      } else if (error) {
        console.error("Error fetching user:", error);
      }
    } catch (error) {
      console.error("Error in fetchUser:", error);
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchUser(data.user.id);
      }

      return { success: true, data };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Then create user profile
        const { error: profileError } = await supabase.from("users").insert([
          {
            user_id: authData.user.id,
            matricule: userData.matricule,
            nom: userData.nom,
            prenom: userData.prenom,
            role: "teacher",
            phone: userData.phone,
            email: userData.email,
            code_matiere: userData.code_matiere,
            approved: false,
          },
        ]);

        if (profileError) throw profileError;
      }

      return { success: true };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error: error.message };
    }
  };
  const emailExists = async (email) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error("Error checking email:", error);
        return false; // or throw error depending on your needs
      }

      // Returns true if data exists (email found), false otherwise
      return data !== null;
    } catch (error) {
      console.error("Unexpected error:", error);
      return false;
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "ecole-attendance-mobile://reset-password",
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Update password error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    session,
    loading,
    login,
    register,
    resetPassword,
    emailExists,
    updatePassword,
    logout,
  };
};
