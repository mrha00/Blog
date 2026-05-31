import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** 个人主页：跳转到当前用户的公开资料页 */
export default function Profile() {
  const { user } = useAuth();

  if (!user?.id) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/users/${user.id}`} replace />;
}
