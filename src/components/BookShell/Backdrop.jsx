import LottieImport from "lottie-react";
import travellerAnimation from "../../assets/traveller.json";

const Lottie = LottieImport.default || LottieImport;

export default function Backdrop() {
  return (
    <div
      className="hidden lg:block fixed inset-0 -z-10 overflow-hidden atlas-grid vignette"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <path
          className="flight-path"
          d="M 100 650 Q 400 200 920 400"
          fill="none"
          stroke="#B8935A"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute bottom-10 left-10 w-48">
        <Lottie animationData={travellerAnimation} loop autoplay />
      </div>
    </div>
  );
}
