'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MapPin,
  Clock,
  User,
  Mail,
  XCircle,
  Archive,
  Edit,
} from 'lucide-react';
import {
  CampingSpotSubmissionWithId,
  CampingSpotTypeLabels,
} from '@/data/schemas/campingSpot';
import {
  rejectSubmission,
  deleteSubmission,
} from '../../app/actions/campingSpotSubmissions';

type SubmissionReviewCardProps = {
  submission: CampingSpotSubmissionWithId;
  onUpdate: () => void;
  onEdit: (submission: CampingSpotSubmissionWithId) => void;
}

export default function SubmissionReviewCard({
  submission,
  onUpdate,
  onEdit,
}: SubmissionReviewCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleReject = async () => {
    if (!reviewNotes.trim()) {
      toast({
        title: 'エラー',
        description: '却下理由を入力してください',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await rejectSubmission(submission._id, reviewNotes);
      toast({
        title: '却下完了',
        description: '投稿を却下しました。',
      });
      setShowRejectDialog(false);
      setReviewNotes('');
      onUpdate();
    } catch (error) {
      console.error('Rejection error:', error);
      toast({
        title: 'エラー',
        description: '却下に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteSubmission(submission._id);
      toast({
        title: '履歴削除完了',
        description:
          submission.status === 'approved'
            ? '投稿履歴を削除しました。車中泊スポットデータは保持されています。'
            : '投稿履歴を削除しました。',
      });
      setShowDeleteDialog(false);
      onUpdate();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'エラー',
        description: '履歴削除に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (submission.status) {
      case 'pending':
        return <Badge variant='secondary'>承認待ち</Badge>;
      case 'approved':
        return (
          <Badge className='bg-green-500 hover:bg-green-600'>承認済み</Badge>
        );
      case 'rejected':
        return <Badge variant='destructive'>却下</Badge>;
      default:
        return <Badge variant='outline'>不明</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col md:flex-row md:justify-between md:items-start gap-4'>
          <div className='flex-1'>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='w-5 h-5' />
              {submission.name}
            </CardTitle>
            <div className='flex items-center gap-2 mt-2 flex-wrap'>
              {getStatusBadge()}
              <Badge variant='outline'>
                {CampingSpotTypeLabels[submission.type]}
              </Badge>
              <Badge
                className={
                  submission.isFree
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                }
              >
                {submission.isFree
                  ? '無料'
                  : submission.pricePerNight
                  ? `¥${submission.pricePerNight}`
                  : '有料：？円'}
              </Badge>
            </div>
          </div>

          <div className='flex gap-2 flex-shrink-0'>
            {submission.status === 'pending' && (
              <>
                <Button
                  size='sm'
                  className='bg-green-600 hover:bg-green-700 cursor-pointer'
                  onClick={() => onEdit(submission)}
                >
                  <Edit className='w-4 h-4 mr-1' />
                  編集して承認
                </Button>

                <Dialog
                  open={showRejectDialog}
                  onOpenChange={setShowRejectDialog}
                >
                  <DialogTrigger asChild>
                    <Button size='sm' variant='destructive' className='cursor-pointer'>
                      <XCircle className='w-4 h-4 mr-1' />
                      却下
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>投稿を却下</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                      <p>この投稿を却下しますか？</p>
                      <div>
                        <label className='text-sm font-medium'>
                          却下理由 *
                        </label>
                        <Textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder='却下理由を入力してください...'
                          rows={3}
                          required
                        />
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          onClick={handleReject}
                          isLoading={loading}
                          disabled={!reviewNotes.trim()}
                          variant='destructive'
                          className='cursor-pointer'
                        >
                          却下する
                        </Button>
                        <Button
                          variant='outline'
                          onClick={() => setShowRejectDialog(false)}
                          className='cursor-pointer'
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {submission.status !== 'pending' && (
              <Dialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    size='sm'
                    variant='outline'
                    className='cursor-pointer'
                    title={`投稿履歴を削除（${
                      submission.status === 'approved'
                        ? '承認済みスポットデータは保持されます'
                        : '却下された投稿データを削除'
                    }）`}
                  >
                    <Archive className='w-4 h-4' />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>投稿履歴を削除</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4'>
                      <p className='text-sm text-blue-800 dark:text-blue-200'>
                        <strong>投稿履歴の削除について：</strong>
                      </p>
                      <ul className='text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1'>
                        {submission.status === 'approved' ? (
                          <>
                            <li>• 投稿データの履歴のみが削除されます</li>
                            <li>
                              • 承認済みの車中泊スポットデータは保持されます
                            </li>
                            <li>• 公開中のスポット情報に影響はありません</li>
                          </>
                        ) : submission.status === 'rejected' ? (
                          <>
                            <li>• 却下された投稿データを削除します</li>
                            <li>
                              • この投稿は車中泊スポットとして公開されていません
                            </li>
                            <li>• データベースから完全に削除されます</li>
                          </>
                        ) : (
                          <>
                            <li>• 投稿データが削除されます</li>
                            <li>• この操作は取り消せません</li>
                          </>
                        )}
                      </ul>
                    </div>
                    <div className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3'>
                      <p className='text-gray-900 dark:text-gray-100 font-medium'>
                        本当に投稿履歴を削除しますか？
                      </p>
                      <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                        この操作は取り消すことができません。
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        onClick={handleDelete}
                        isLoading={loading}
                        variant='destructive'
                        className='cursor-pointer'
                      >
                        履歴を削除する
                      </Button>
                      <Button
                        variant='outline'
                        onClick={() => setShowDeleteDialog(false)}
                        className='cursor-pointer'
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <h4 className='font-medium text-sm text-gray-500 mb-1'>場所</h4>
              <p>{submission.prefecture}</p>
              {submission.address && (
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  {submission.address}
                </p>
              )}
              {submission.url && (
                <a
                  href={submission.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-sm text-blue-600 dark:text-blue-400 hover:underline'
                >
                  参考URL ↗
                </a>
              )}
              {submission.coordinates && (
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  座標: {submission.coordinates[1].toFixed(6)},{' '}
                  {submission.coordinates[0].toFixed(6)}
                </p>
              )}
            </div>

            <div>
              <h4 className='font-medium text-sm text-gray-500 mb-1'>
                施設情報
              </h4>
              <div className='space-y-1'>
                {submission.hasRoof && (
                  <span className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1'>
                    屋根あり
                  </span>
                )}
                {submission.hasPowerOutlet && (
                  <span className='inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-1'>
                    電源あり
                  </span>
                )}
                {!submission.isFree && submission.priceNote && (
                  <p className='text-sm text-gray-600'>
                    {submission.priceNote}
                  </p>
                )}
              </div>
            </div>
          </div>

          {submission.notes && (
            <div>
              <h4 className='font-medium text-sm text-gray-500 mb-1'>備考</h4>
              <p className='text-sm'>{submission.notes}</p>
            </div>
          )}

          <div className='flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-500 pt-2 border-t'>
            <div className='flex items-center gap-1'>
              <Clock className='w-4 h-4' />
              {new Date(submission.submittedAt).toISOString().split('T')[0]}
            </div>
            {submission.submitterName && (
              <div className='flex items-center gap-1'>
                <User className='w-4 h-4' />
                <span className='break-all'>{submission.submitterName}</span>
              </div>
            )}
            {submission.submitterEmail && (
              <div className='flex items-center gap-1'>
                <Mail className='w-4 h-4' />
                <span className='break-all'>{submission.submitterEmail}</span>
              </div>
            )}
          </div>

          {(submission.reviewedAt || submission.reviewNotes) && (
            <div className='bg-gray-50 dark:bg-gray-800 p-3 rounded-lg'>
              <h4 className='font-medium text-sm text-gray-700 dark:text-gray-300 mb-1'>
                管理者レビュー
              </h4>
              {submission.reviewedAt && (
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {new Date(submission.reviewedAt).toISOString().split('T')[0]}{' '}
                  by {submission.reviewedBy}
                </p>
              )}
              {submission.reviewNotes && (
                <p className='text-sm text-gray-900 dark:text-gray-100 mt-1 break-words whitespace-pre-wrap'>{submission.reviewNotes}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
