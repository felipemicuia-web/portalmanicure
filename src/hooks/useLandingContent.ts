import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LandingContent, DEFAULT_LANDING_CONTENT } from "@/types/landing";

const DRAFT_KEY = "landing_page_draft";
const PUBLISHED_KEY = "landing_page_published";

function parseContent(value: string | null): LandingContent | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as LandingContent;
  } catch {
    return null;
  }
}

/** Read-only hook for the public landing page — reads published content */
export function useLandingContent() {
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .eq("key", PUBLISHED_KEY)
        .maybeSingle();

      if (!error && data?.value) {
        const parsed = parseContent(data.value);
        if (parsed) setContent(parsed);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { content, loading };
}

/** Admin hook with draft/publish workflow */
export function useLandingContentAdmin() {
  const [draft, setDraft] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);
  const [published, setPublished] = useState<LandingContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", [DRAFT_KEY, PUBLISHED_KEY]);

      if (!error && data) {
        let draftContent: LandingContent | null = null;
        let publishedContent: LandingContent | null = null;

        for (const row of data) {
          if (row.key === DRAFT_KEY) draftContent = parseContent(row.value);
          if (row.key === PUBLISHED_KEY) publishedContent = parseContent(row.value);
        }

        setPublished(publishedContent);
        // Draft takes priority, then published, then defaults
        setDraft(draftContent ?? publishedContent ?? DEFAULT_LANDING_CONTENT);
      }
      setLoading(false);
    }
    load();
  }, []);

  const updateDraft = useCallback((updater: (prev: LandingContent) => LandingContent) => {
    setDraft((prev) => {
      const next = updater(prev);
      setHasUnsavedChanges(true);
      return next;
    });
  }, []);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    const value = JSON.stringify(draft);

    // Upsert: try update first, insert if not exists
    const { data: existing } = await supabase
      .from("platform_settings")
      .select("id")
      .eq("key", DRAFT_KEY)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("platform_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", DRAFT_KEY);
    } else {
      await supabase
        .from("platform_settings")
        .insert({ key: DRAFT_KEY, value });
    }

    setHasUnsavedChanges(false);
    setSaving(false);
  }, [draft]);

  const publish = useCallback(async () => {
    setPublishing(true);
    const value = JSON.stringify(draft);

    // Save as published
    const { data: existing } = await supabase
      .from("platform_settings")
      .select("id")
      .eq("key", PUBLISHED_KEY)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("platform_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", PUBLISHED_KEY);
    } else {
      await supabase
        .from("platform_settings")
        .insert({ key: PUBLISHED_KEY, value });
    }

    // Also save as draft to keep them in sync
    const { data: draftExists } = await supabase
      .from("platform_settings")
      .select("id")
      .eq("key", DRAFT_KEY)
      .maybeSingle();

    if (draftExists) {
      await supabase
        .from("platform_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", DRAFT_KEY);
    } else {
      await supabase
        .from("platform_settings")
        .insert({ key: DRAFT_KEY, value });
    }

    setPublished(draft);
    setHasUnsavedChanges(false);
    setPublishing(false);
  }, [draft]);

  const discardDraft = useCallback(() => {
    setDraft(published ?? DEFAULT_LANDING_CONTENT);
    setHasUnsavedChanges(false);
  }, [published]);

  return {
    draft,
    published,
    loading,
    saving,
    publishing,
    hasUnsavedChanges,
    updateDraft,
    saveDraft,
    publish,
    discardDraft,
  };
}
