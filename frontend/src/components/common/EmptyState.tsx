import { PackageOpen } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = 'No products found',
  message = 'We couldn\'t find any products matching your criteria.',
  actionLabel = 'Browse All Products',
  actionHref = '/products',
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
        {icon || <PackageOpen className="w-10 h-10 text-gray-400" />}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">{message}</p>
      {actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
