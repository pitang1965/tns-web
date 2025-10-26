'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import { CampingSpotSubmissionWithId } from '@/data/schemas/campingSpot';
import { getCampingSpotSubmissions } from '../../../app/actions/campingSpotSubmissions';
import SubmissionReviewCard from '@/components/admin/SubmissionReviewCard';
import { LoadingState } from '@/components/common/LoadingState';
import { celebrateSubmission } from '@/lib/confetti';

// Dynamically import the form component to avoid SSR issues
const SubmissionEditForm = dynamic(
  () => import('@/components/admin/SubmissionEditForm'),
  {
    ssr: false,
  }
);

export default function SubmissionsAdminPage() {
  const { user, isLoading } = useUser();
  const { toast } = useToast();

  // Check if user is admin
  const isAdmin =
    user?.email &&
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')
      .map((email) => email.trim())
      .includes(user.email);

  const [submissions, setSubmissions] = useState<CampingSpotSubmissionWithId[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [editingSubmission, setEditingSubmission] =
    useState<CampingSpotSubmissionWithId | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const filteredSubmissions = useMemo(() => {
    if (activeTab === 'all') return submissions;
    return submissions.filter((submission) => submission.status === activeTab);
  }, [submissions, activeTab]);

  const submissionStats = useMemo(() => {
    const pending = submissions.filter((s) => s.status === 'pending').length;
    const approved = submissions.filter((s) => s.status === 'approved').length;
    const rejected = submissions.filter((s) => s.status === 'rejected').length;
    return { pending, approved, rejected, total: submissions.length };
  }, [submissions]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getCampingSpotSubmissions();
      setSubmissions(data);
    } catch (error) {
      toast({
        title: 'エラー',
        description: '投稿データの読み込みに失敗しました',
        variant: 'destructive',
      });
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in - redirect to login
        window.location.href =
          '/auth/login?returnTo=' +
          encodeURIComponent(window.location.pathname);
        return;
      }

      if (isAdmin) {
        loadSubmissions();
      }
    }
  }, [isAdmin, user, isLoading]);

  const handleRefresh = () => {
    loadSubmissions();
  };

  const handleEdit = (submission: CampingSpotSubmissionWithId) => {
    setEditingSubmission(submission);
    setShowEditForm(true);
  };

  const handleEditClose = () => {
    setShowEditForm(false);
    setEditingSubmission(null);
  };

  const handleEditSuccess = () => {
    console.log('handleEditSuccess: Starting success handler...');

    // 承認して作成成功！紙吹雪でお祝い
    celebrateSubmission();

    loadSubmissions();
    console.log('handleEditSuccess: Submissions reloaded');
    handleEditClose();
    console.log('handleEditSuccess: Edit form closed');
    toast({
      title: '🎉 承認完了',
      description: '車中泊スポットを承認し、作成しました',
    });
    console.log('handleEditSuccess: Toast displayed');
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-2'></div>
          <p className='text-gray-600 dark:text-gray-400'>
            認証情報を確認中...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-2'></div>
          <p className='text-gray-600 dark:text-gray-400'>
            ログインページに移動中...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='flex flex-col justify-center items-center h-screen space-y-4'>
        <h1 className='text-2xl font-bold text-red-600'>アクセス拒否</h1>
        <p className='text-gray-600 dark:text-gray-300'>
          この機能は管理者のみ利用可能です。
        </p>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-6 py-6 space-y-6 min-h-screen'>
      <div className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold'>投稿管理</h1>
        <Button onClick={handleRefresh} variant='outline' disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          更新
        </Button>
      </div>

      {/* Stats Cards - Hidden on mobile */}
      <div className='hidden md:grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2'>
              <Clock className='w-5 h-5 text-orange-600' />
              <div>
                <div className='text-2xl font-bold text-orange-600'>
                  {submissionStats.pending}
                </div>
                <div className='text-sm text-gray-600'>承認待ち</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              <div>
                <div className='text-2xl font-bold text-green-600'>
                  {submissionStats.approved}
                </div>
                <div className='text-sm text-gray-600'>承認済み</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2'>
              <XCircle className='w-5 h-5 text-red-600' />
              <div>
                <div className='text-2xl font-bold text-red-600'>
                  {submissionStats.rejected}
                </div>
                <div className='text-sm text-gray-600'>却下</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2'>
              <Users className='w-5 h-5 text-blue-600' />
              <div>
                <div className='text-2xl font-bold text-blue-600'>
                  {submissionStats.total}
                </div>
                <div className='text-sm text-gray-600'>総投稿数</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='pending'>
            承認待ち ({submissionStats.pending})
          </TabsTrigger>
          <TabsTrigger value='approved'>
            承認済み ({submissionStats.approved})
          </TabsTrigger>
          <TabsTrigger value='rejected'>
            却下 ({submissionStats.rejected})
          </TabsTrigger>
          <TabsTrigger value='all'>
            すべて ({submissionStats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'pending' && '承認待ちの投稿'}
                {activeTab === 'approved' && '承認済みの投稿'}
                {activeTab === 'rejected' && '却下された投稿'}
                {activeTab === 'all' && 'すべての投稿'} (
                {filteredSubmissions.length}件)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='text-center py-8'>
                  <LoadingState variant='inline' />
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  {activeTab === 'pending' && '承認待ちの投稿はありません'}
                  {activeTab === 'approved' && '承認済みの投稿はありません'}
                  {activeTab === 'rejected' && '却下された投稿はありません'}
                  {activeTab === 'all' && '投稿はありません'}
                </div>
              ) : (
                <div className='space-y-4'>
                  {filteredSubmissions.map((submission) => (
                    <SubmissionReviewCard
                      key={submission._id}
                      submission={submission}
                      onUpdate={loadSubmissions}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showEditForm && editingSubmission && (
        <SubmissionEditForm
          submission={editingSubmission}
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
