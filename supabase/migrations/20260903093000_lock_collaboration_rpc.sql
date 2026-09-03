-- Supabase grants function execution to API roles by default. Collaboration RPCs are authenticated-only.
revoke all on function public.create_trip_collaboration_invite(text, text) from public, anon;
revoke all on function public.accept_trip_collaboration_invite(uuid) from public, anon;
revoke all on function public.get_my_trip_collaborations() from public, anon;
revoke all on function public.get_trip_collaboration(uuid) from public, anon;
revoke all on function public.save_trip_collaboration(uuid, jsonb) from public, anon;
revoke all on function public.list_trip_collaborators(text) from public, anon;
revoke all on function public.list_trip_collaboration_invites(text) from public, anon;
revoke all on function public.get_trip_activity(text, integer) from public, anon;
revoke all on function public.revoke_trip_collaboration_invite(uuid) from public, anon;
revoke all on function public.remove_trip_collaborator(text, uuid) from public, anon;
