import { useState } from "react";
import { Star, ThumbsUp, MessageSquare, Search, Filter, MoreVertical, Eye, Trash2, Flag } from "lucide-react";

const reviews = [
  { 
    id: 1, 
    customer: "John Smith", 
    company: "Swift Logistics", 
    mechanic: "Mike Johnson", 
    service: "Brake Replacement", 
    rating: 5, 
    comment: "Excellent service! Very professional and quick. The mechanic explained everything clearly.", 
    date: "2025-03-12",
    status: "Published"
  },
  { 
    id: 2, 
    customer: "Sarah Williams", 
    company: "Fast Freight Co", 
    mechanic: "Lisa Anderson", 
    service: "Engine Repair", 
    rating: 4, 
    comment: "Good work but took a bit longer than expected. Overall satisfied with the result.", 
    date: "2025-03-11",
    status: "Published"
  },
  { 
    id: 3, 
    customer: "David Brown", 
    company: "Global Transport", 
    mechanic: "Mike Johnson", 
    service: "Oil Change", 
    rating: 5, 
    comment: "Fast and efficient. Great value for money!", 
    date: "2025-03-10",
    status: "Published"
  },
  { 
    id: 4, 
    customer: "Emma Davis", 
    company: "City Movers", 
    mechanic: "Tom Wilson", 
    service: "Transmission Service", 
    rating: 3, 
    comment: "Service was okay but communication could be better. Had to follow up multiple times.", 
    date: "2025-03-09",
    status: "Flagged"
  },
  { 
    id: 5, 
    customer: "Michael Chen", 
    company: "Swift Logistics", 
    mechanic: "Lisa Anderson", 
    service: "AC Repair", 
    rating: 5, 
    comment: "Outstanding! Fixed the issue perfectly and even checked other systems. Highly recommend.", 
    date: "2025-03-08",
    status: "Published"
  },
];

export function Reviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const toggleDropdown = (id: number) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleAction = (action: string, id: number) => {
    console.log(`Action: ${action} on review: ${id}`);
    setOpenDropdown(null);
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.mechanic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.service.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = ratingFilter === "All" || review.rating.toString() === ratingFilter;
    const matchesStatus = statusFilter === "All" || review.status === statusFilter;
    
    return matchesSearch && matchesRating && matchesStatus;
  });

  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;
  const fourStarCount = reviews.filter(r => r.rating === 4).length;
  const flaggedCount = reviews.filter(r => r.status === "Flagged").length;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        size={16} 
        className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
      />
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-800";
      case "Flagged":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-600 mt-1">Monitor customer feedback and ratings</p>
        </div>
      </div>

      {/* Rating Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Average Rating</p>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="text-yellow-600 fill-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{avgRating}</p>
          <div className="flex items-center gap-1 mt-2">
            {renderStars(Math.round(parseFloat(avgRating)))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">5-Star Reviews</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <ThumbsUp className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fiveStarCount}</p>
          <p className="text-sm text-gray-500 mt-2">{((fiveStarCount / reviews.length) * 100).toFixed(0)}% of total</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">4-Star Reviews</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fourStarCount}</p>
          <p className="text-sm text-gray-500 mt-2">{((fourStarCount / reviews.length) * 100).toFixed(0)}% of total</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Flagged Reviews</p>
            <div className="p-2 bg-red-100 rounded-lg">
              <Flag className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{flaggedCount}</p>
          <p className="text-sm text-gray-500 mt-2">Need attention</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by customer, mechanic, or service..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Published">Published</option>
            <option value="Flagged">Flagged</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  {review.customer.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{review.customer}</h3>
                  <p className="text-sm text-gray-600">{review.company}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(review.status)}`}>
                  {review.status}
                </span>
                <div className="relative">
                  <button
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={() => toggleDropdown(review.id)}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {openDropdown === review.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setOpenDropdown(null)}
                      />
                      
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="py-1">
                          <button 
                            onClick={() => handleAction("view", review.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye size={16} />
                            <span>View Details</span>
                          </button>
                          
                          <button 
                            onClick={() => handleAction("respond", review.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <MessageSquare size={16} />
                            <span>Respond to Review</span>
                          </button>

                          <button 
                            onClick={() => handleAction("flag", review.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
                          >
                            <Flag size={16} />
                            <span>Flag Review</span>
                          </button>

                          <div className="border-t border-gray-200 my-1"></div>

                          <button 
                            onClick={() => handleAction("delete", review.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            <span>Delete Review</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-gray-700">{review.comment}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <strong>Service:</strong> {review.service}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <strong>Mechanic:</strong> {review.mechanic}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
