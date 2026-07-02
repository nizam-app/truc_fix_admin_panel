import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Filter,
  Flag,
  MoreVertical,
  Search,
  Shield,
  Star,
  ThumbsUp,
} from "lucide-react";
import { getApiBaseUrl, getStoredAdminSession } from "../auth";
import { useAdminDialog } from "../adminDialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type ReviewItem = {
  _id: string;
  customerName: string;
  companyName?: string;
  mechanicName?: string;
  serviceLabel?: string;
  rating: number;
  comment?: string;
  status: "PUBLISHED" | "FLAGGED" | "HIDDEN";
  createdAt: string;
};

type ReviewStats = {
  averageRating: number;
  fiveStarReviews: number;
  fourStarReviews: number;
  flaggedReviews: number;
  total: number;
};

const defaultStats: ReviewStats = {
  averageRating: 0,
  fiveStarReviews: 0,
  fourStarReviews: 0,
  flaggedReviews: 0,
  total: 0,
};

const formatStatusLabel = (status: ReviewItem["status"]) => {
  switch (status) {
    case "PUBLISHED":
      return "Published";
    case "FLAGGED":
      return "Flagged";
    case "HIDDEN":
      return "Hidden";
    default:
      return status;
  }
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function Reviews() {
  const { confirm } = useAdminDialog();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>(defaultStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<ReviewItem | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const session = getStoredAdminSession();

  const fetchReviews = async () => {
    if (!session?.accessToken) {
      setError("Admin session not found. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (ratingFilter !== "All") params.set("rating", ratingFilter);
      if (statusFilter !== "All") params.set("status", statusFilter);

      const response = await fetch(
        `${getApiBaseUrl()}/admin/reviews${params.toString() ? `?${params}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load reviews");
      }

      setReviews(payload?.data?.items || []);
      setStats(payload?.data?.stats || defaultStats);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load reviews");
      setReviews([]);
      setStats(defaultStats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, [searchTerm, ratingFilter, statusFilter]);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
      />
    ));

  const getStatusColor = (status: ReviewItem["status"]) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "FLAGGED":
        return "bg-red-100 text-red-800";
      case "HIDDEN":
        return "bg-gray-200 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const reviewMixLabel = useMemo(() => {
    if (!stats.total) return "No reviews yet";
    return `${stats.total} total reviews`;
  }, [stats.total]);

  const updateReviewStatus = async (reviewId: string, status: ReviewItem["status"]) => {
    if (!session?.accessToken) {
      setError("Admin session not found. Please sign in again.");
      return;
    }

    setIsUpdatingId(reviewId);
    setError("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update review");
      }

      await fetchReviews();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update review");
    } finally {
      setIsUpdatingId(null);
    }
  };

  const viewReview = async (review: ReviewItem) => {
    if (!session?.accessToken) {
      setError("Admin session not found. Please sign in again.");
      return;
    }

    setIsUpdatingId(review._id);
    setError("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/reviews/${review._id}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load review");
      }

      setActiveReview(payload?.data || review);
      setDetailOpen(true);
    } catch (viewError) {
      setError(viewError instanceof Error ? viewError.message : "Failed to load review");
    } finally {
      setIsUpdatingId(null);
    }
  };

  const deleteReview = async (review: ReviewItem) => {
    if (!session?.accessToken) {
      setError("Admin session not found. Please sign in again.");
      return;
    }

    const confirmed = await confirm({
      title: "Delete review",
      message: `Delete review from ${review.customerName}?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;

    setIsDeletingId(review._id);
    setError("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/reviews/${review._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete review");
      }

      if (activeReview?._id === review._id) {
        setDetailOpen(false);
        setActiveReview(null);
      }

      await fetchReviews();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete review");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div>
      <Dialog
        open={detailOpen}
        onOpenChange={(nextOpen) => {
          setDetailOpen(nextOpen);
          if (!nextOpen) setActiveReview(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Review details</DialogTitle>
            <DialogDescription>Moderation view of a single review.</DialogDescription>
          </DialogHeader>

          {activeReview ? (
            <div className="grid gap-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {activeReview.customerName}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {activeReview.companyName || "Independent customer"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(activeReview.rating)}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(activeReview.createdAt)}
                    </span>
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className={`${getStatusColor(activeReview.status)} border-transparent`}
                >
                  {formatStatusLabel(activeReview.status)}
                </Badge>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs font-medium text-gray-500">Context</p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-gray-900">Service:</span>{" "}
                    {activeReview.serviceLabel || "Not provided"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Mechanic:</span>{" "}
                    {activeReview.mechanicName || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs font-medium text-gray-500">Comment</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                  {activeReview.comment || "No written comment"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">
              No review selected.
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="mt-1 text-gray-600">Moderate customer feedback and platform trust signals</p>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Average Rating</p>
            <div className="rounded-lg bg-yellow-100 p-2">
              <Star className="fill-yellow-600 text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
          <div className="mt-2 flex items-center gap-1">{renderStars(Math.round(stats.averageRating))}</div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">5-Star Reviews</p>
            <div className="rounded-lg bg-green-100 p-2">
              <ThumbsUp className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.fiveStarReviews}</p>
          <p className="mt-2 text-sm text-gray-500">{reviewMixLabel}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">4-Star Reviews</p>
            <div className="rounded-lg bg-blue-100 p-2">
              <Star className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.fourStarReviews}</p>
          <p className="mt-2 text-sm text-gray-500">Strong quality signals</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Flagged Reviews</p>
            <div className="rounded-lg bg-red-100 p-2">
              <Flag className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.flaggedReviews}</p>
          <p className="mt-2 text-sm text-gray-500">Need moderation review</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by customer, mechanic, company, or service..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <select
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value)}
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="FLAGGED">Flagged</option>
            <option value="HIDDEN">Hidden</option>
          </select>
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
            <Filter size={16} />
            Moderation filters
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">
            No reviews found for the selected filters.
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-lg font-semibold text-white">
                    {review.customerName
                      .split(" ")
                      .map((name) => name[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{review.customerName}</h3>
                    <p className="text-sm text-gray-600">{review.companyName || "Independent customer"}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                      <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(review.status)} border-transparent`}
                  >
                    {formatStatusLabel(review.status)}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded p-1 hover:bg-gray-100">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => void viewReview(review)}
                        disabled={isUpdatingId === review._id}
                      >
                        <Eye size={16} />
                        View details
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => void updateReviewStatus(review._id, "FLAGGED")}
                        disabled={isUpdatingId === review._id}
                      >
                        <Flag size={16} />
                        Flag review
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => void updateReviewStatus(review._id, "PUBLISHED")}
                        disabled={isUpdatingId === review._id}
                      >
                        <ThumbsUp size={16} />
                        Publish review
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => void updateReviewStatus(review._id, "HIDDEN")}
                        disabled={isUpdatingId === review._id}
                      >
                        <Shield size={16} />
                        Hide review
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => void deleteReview(review)}
                        variant="destructive"
                        disabled={isDeletingId === review._id}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-gray-700">{review.comment || "No written comment provided."}</p>
              </div>

              <div className="flex items-center gap-4 border-t border-gray-100 pt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <strong>Service:</strong> {review.serviceLabel || "Not provided"}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <strong>Mechanic:</strong> {review.mechanicName || "Not provided"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
