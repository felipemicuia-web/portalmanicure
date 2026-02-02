import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ProfileHeader } from "./ProfileHeader";
import { PhotoGallery } from "./PhotoGallery";
import { FollowingList } from "@/components/professional/FollowingList";

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

interface ProfilePageProps {
  user: User;
}

export function ProfilePage({ user }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
        .insert({ user_id: user.id })
        .select()
        .single();
      
      setProfile(newProfile);
    } else {
      setProfile(profileData);
    }

    // Fetch gallery photos
    const { data: photosData } = await supabase
      .from("gallery_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setPhotos(photosData || []);

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
        photoCount={photos.length}
        bookingCount={bookingCount}
        onProfileUpdate={fetchData}
      />
      <FollowingList user={user} />
      <PhotoGallery
        user={user}
        photos={photos}
        onPhotosChange={fetchData}
      />
    </div>
  );
}
