import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ProfileHeader } from "./ProfileHeader";
import { FollowingList } from "@/components/professional/FollowingList";
import { useTenant } from "@/contexts/TenantContext";

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface ProfilePageProps {
  user: User;
}

export function ProfilePage({ user }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { tenantId } = useTenant();

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // If no profile exists, create one
    if (!profileData) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({ user_id: user.id, tenant_id: tenantId! })
        .select()
        .single();
      
      setProfile(newProfile);
    } else {
      setProfile(profileData);
    }

    // Fetch booking count
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setBookingCount(count || 0);

    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProfileHeader
        user={user}
        profile={profile}
        bookingCount={bookingCount}
        onProfileUpdate={fetchData}
      />
      <FollowingList user={user} />
    </div>
  );
}
