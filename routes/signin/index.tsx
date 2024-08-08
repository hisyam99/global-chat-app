// Komponen LoginPage yang menampilkan halaman login
export default function LoginPage() {
  return (
    <div className="py-24 flex items-center justify-center">
      {/* Card utama untuk tampilan halaman login */}
      <div className="card shadow-lg w-full max-w-lg">
        <div className="card-body">
          {/* Judul halaman login */}
          <h2 className="text-2xl font-bold mb-4">Sign In</h2>

          {/* Pesan kesalahan jika pengguna belum masuk */}
          <p className="text-red-500 mb-4">Oops! You need to sign in first.</p>
          {/* Daftar metode login */}
          <div className="flex flex-col space-y-2">
            {/* Tombol untuk login dengan Google */}
            <a
              href="/signin/google"
              className="btn flex justify-start items-center"
            >
              <img
                width="20"
                height="20"
                src="/icon/google-icon.svg"
                alt="Google"
                className="mr-2"
              />
              Sign In with Google
            </a>
            {/* Tombol untuk login dengan Facebook */}
            <a
              href="/signin/facebook"
              className="btn flex justify-start items-center"
            >
              <img
                width="20"
                height="20"
                src="/icon/facebook-icon.svg"
                alt="Facebook"
                className="mr-2"
              />
              Sign In with Facebook
            </a>
            {/* Tombol untuk login dengan Clerk */}
            <a
              href="/signin/clerk"
              className="btn flex justify-start items-center"
            >
              <img
                width="20"
                height="20"
                src="/icon/apple-icon.svg"
                alt="Apple"
                className="mr-2"
              />
              Sign In with Apple
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
