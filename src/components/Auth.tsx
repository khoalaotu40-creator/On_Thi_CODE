import { useState, useEffect } from 'react';
import { User, Lock, ExternalLink, UserPlus, LogIn, KeyRound } from 'lucide-react';

interface AuthProps {
  onLogin: (username: string) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Seed a demo user
    const jsonStr = localStorage.getItem('mockUsers');
    const users = jsonStr ? JSON.parse(jsonStr) : [];
    if (!users.find((u: any) => u.username === 'demo')) {
      users.push({ username: 'demo', password: 'demo_password' });
      localStorage.setItem('mockUsers', JSON.stringify(users));
    }
  }, []);

  const handleDemoLogin = () => {
    setUsername('demo');
    setPassword('demo_password');
    // Simulate natural submission or directly log in
    onLogin('demo');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Vui lòng nhập tài khoản và mật khẩu.');
      return;
    }

    const jsonStr = localStorage.getItem('mockUsers');
    const users = jsonStr ? JSON.parse(jsonStr) : [];

    if (isLogin) {
      const user = users.find((u: any) => u.username === username && u.password === password);
      if (user) {
        onLogin(username);
      } else {
        setError('Sai tên đăng nhập hoặc mật khẩu.');
      }
    } else {
      const exists = users.find((u: any) => u.username === username);
      if (exists) {
        setError('Tên đăng nhập đã tồn tại.');
      } else {
        users.push({ username, password });
        localStorage.setItem('mockUsers', JSON.stringify(users));
        onLogin(username);
      }
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-primary mb-4">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-on-surface mb-2 tracking-tight">
            {isLogin ? 'Đăng nhập vào Hệ thống' : 'Đăng ký Tài khoản Mới'}
          </h1>
          <p className="text-on-surface-variant text-sm">
            {isLogin ? 'Chào mừng bạn quay trở lại, tiếp tục công việc của bạn.' : 'Bắt đầu trải nghiệm các công cụ xử lý ngân hàng câu hỏi AI.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-error-container text-error text-sm px-4 py-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-on-surface">Tên đăng nhập</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-on-surface-variant" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface"
                placeholder="Nhập tên đăng nhập giả lập..."
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-on-surface">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-on-surface-variant" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-on-primary font-medium py-2.5 rounded-xl transition-all shadow-sm mt-2"
          >
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            <span>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</span>
          </button>

          {isLogin && (
            <button
              onClick={handleDemoLogin}
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-medium py-2.5 rounded-xl transition-all shadow-sm mt-2 border border-outline-variant"
            >
              <User size={18} className="text-primary" />
              <span>Đăng nhập thử với tài khoản Demo</span>
            </button>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-on-surface-variant">
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setUsername('');
                setPassword('');
              }}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "Đăng ký ngay" : "Đăng nhập khoản có sẵn"}
            </button>
          </p>
        </div>
        
        <div className="mt-8 pt-6 border-t border-outline-variant text-center">
           <p className="text-xs text-on-surface-variant">
             (Tạm thời chạy phiên bản JSON / Local Storage không cần Setup Firebase)
           </p>
        </div>
      </div>
    </div>
  );
}
