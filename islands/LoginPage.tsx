import { useEffect, useState } from "preact/hooks";

export default function LoginPage(props: { url: URL }) {
  const [successUrl, setSuccessUrl] = useState("/");

  useEffect(() => {
    const referer = document.referrer;
    if (referer && new URL(referer).origin === location.origin) {
      setSuccessUrl(referer);
    } else {
      const currentUrl = new URL(props.url);
      currentUrl.pathname = "/";
      setSuccessUrl(currentUrl.toString());
    }
  }, [props.url]);

  return (
    <div className="py-24 flex items-center justify-center">
      <div className="card shadow-lg w-full max-w-lg">
        <div className="card-body">
          <h2 className="text-2xl font-bold mb-4">Sign In</h2>
          <p className="text-red-500 mb-4">Oops! You need to sign in first.</p>
          <div className="flex flex-col space-y-2">
            <a
              href={`/signin/google?success_url=${encodeURIComponent(successUrl)}`}
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
            <a
              href={`/signin/facebook?success_url=${encodeURIComponent(successUrl)}`}
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
            <a
              href={`/signin/clerk?success_url=${encodeURIComponent(successUrl)}`}
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
