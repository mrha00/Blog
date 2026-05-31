import { Link } from 'react-router-dom';

interface UserLinkProps {
  userId?: number | null;
  name: string;
  className?: string;
  stopPropagation?: boolean;
}

export default function UserLink({
  userId,
  name,
  className = '',
  stopPropagation = false,
}: UserLinkProps) {
  if (!userId || userId <= 0) {
    return <span className={className}>{name}</span>;
  }

  return (
    <Link
      to={`/users/${userId}`}
      className={`font-medium text-blue-700 transition hover:text-blue-900 hover:underline dark:text-blue-400 dark:hover:text-blue-300 ${className}`}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      {name}
    </Link>
  );
}
