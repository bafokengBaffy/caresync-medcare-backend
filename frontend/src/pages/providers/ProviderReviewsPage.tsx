import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  Filter,
  Loader2,
  User
} from 'lucide-react';
import { format } from 'date-fns';

const ProviderReviewsPage = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();

  // Mock data
  const reviews = [
    { id: '1', patientName: 'John D.', rating: 5, comment: 'Excellent bedside manner. Very thorough and caring.', date: '2023-10-20T10:00:00Z' },
    { id: '2', patientName: 'Jane S.', rating: 4, comment: 'Very knowledgeable but wait time was a bit long.', date: '2023-10-18T14:30:00Z' },
    { id: '3', patientName: 'Alice J.', rating: 5, comment: 'Always attentive and explains everything clearly.', date: '2023-10-15T09:15:00Z' },
    { id: '4', patientName: 'Bob B.', rating: 5, comment: 'Highly recommend. Excellent clinician.', date: '2023-10-10T11:00:00Z' },
  ];

  const averageRating = 4.8;
  const totalReviews = 142;
  const ratingDistribution = [
    { stars: 5, count: 110, percentage: 77 },
    { stars: 4, count: 22, percentage: 16 },
    { stars: 3, count: 6, percentage: 4 },
    { stars: 2, count: 3, percentage: 2 },
    { stars: 1, count: 1, percentage: 1 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(`/providers/${providerId}`)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" />
              Patient Reviews
            </h1>
            <p className="text-sm text-gray-500 mt-1">Feedback and ratings from verified patients.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Rating Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center justify-center p-6 border-r border-gray-100">
              <p className="text-6xl font-bold text-gray-900">{averageRating}</p>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-5 h-5 ${i <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">Based on {totalReviews} reviews</p>
            </div>
            <div className="space-y-2">
              {ratingDistribution.map(rating => (
                <div key={rating.stars} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-12 flex items-center gap-1">{rating.stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" /></span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-amber-400" style={{ width: `${rating.percentage}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{rating.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          <div className="px-6 py-4 flex items-center justify-between bg-gray-50 border-b">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Recent Feedback</h2>
            <button className="text-xs font-medium text-indigo-600 flex items-center gap-1"><Filter className="w-3 h-3" /> Filter</button>
          </div>
          {reviews.map(review => (
            <div key={review.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                  {review.patientName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{review.patientName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{format(new Date(review.date), 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700">{review.comment}</p>
                  <button className="mt-3 text-xs font-medium text-gray-500 hover:text-indigo-600 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Helpful</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProviderReviewsPage;