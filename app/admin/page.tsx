'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Flag, Eye, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { Profile, Wish, Report } from '@/types';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalWishes: 0, totalReports: 0, pendingReports: 0 });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const checkAdmin = async () => {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!data || data.role !== 'admin') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);
      const [usersRes, wishesRes, reportsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('wishes').select('*, profiles:user_id(*)').order('created_at', { ascending: false }).limit(50),
        supabase.from('reports').select('*, reporter:reporter_id(*)').order('created_at', { ascending: false }).limit(50),
      ]);
      setUsers((usersRes.data as Profile[]) || []);
      setWishes((wishesRes.data as Wish[]) || []);
      setReports((reportsRes.data as Report[]) || []);
      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalWishes: wishesRes.data?.length || 0,
        totalReports: reportsRes.data?.length || 0,
        pendingReports: (reportsRes.data as Report[])?.filter((r) => r.status === 'pending').length || 0,
      });
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    await supabase.from('reports').update({ status }).eq('id', reportId);
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
  };

  const handleDeleteWish = async (wishId: string) => {
    if (!confirm('Are you sure? This will permanently delete the wish and all its media/offers.')) return;
    await supabase.from('wishes').delete().eq('id', wishId);
    setWishes((prev) => prev.filter((w) => w.id !== wishId));
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Suspend this user? They will be unable to sign in.')) return;
    await supabase.from('profiles').update({ role: 'user' }).eq('id', userId);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You need admin privileges to access this page.</p>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => router.push('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage users, wishes, and reports</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users },
            { label: 'Total Wishes', value: stats.totalWishes, icon: Eye },
            { label: 'Total Reports', value: stats.totalReports, icon: Flag },
            { label: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, highlight: true },
          ].map((stat) => (
            <Card key={stat.label} className={`border-0 shadow-md ${stat.highlight ? 'border-l-4 border-l-amber-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="reports">
          <TabsList className="mb-6">
            <TabsTrigger value="reports"><Flag className="w-4 h-4 mr-1" />Reports</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" />Users</TabsTrigger>
            <TabsTrigger value="wishes"><Eye className="w-4 h-4 mr-1" />Wishes</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>Reports</CardTitle></CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No reports yet</p>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'secondary'}>
                              {report.status}
                            </Badge>
                            <span className="text-sm font-medium capitalize">{report.entity_type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{report.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Reported on {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => handleResolveReport(report.id, 'resolved')}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />Resolve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleResolveReport(report.id, 'dismissed')}>
                            <XCircle className="w-4 h-4 mr-1" />Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>Users</CardTitle></CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No users yet</p>
                ) : (
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{u.full_name || u.username}</p>
                            <p className="text-xs text-muted-foreground">@{u.username} | {u.reputation_score} rep | Joined {new Date(u.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={u.role === 'admin' ? 'default' : 'outline'}>{u.role}</Badge>
                          <Button size="sm" variant="outline" onClick={() => handleSuspendUser(u.id)}>Suspend</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wishes">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>Wishes</CardTitle></CardHeader>
              <CardContent>
                {wishes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No wishes yet</p>
                ) : (
                  <div className="space-y-3">
                    {wishes.map((wish) => (
                      <div key={wish.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{wish.status}</Badge>
                            <span className="text-sm font-medium truncate">{wish.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            By {wish.profiles?.username} on {new Date(wish.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/wishes/${wish.id}`}>View</Link>
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteWish(wish.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
