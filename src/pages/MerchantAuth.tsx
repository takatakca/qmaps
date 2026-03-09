import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Redirect to unified auth page with merchant role pre-selected
const MerchantAuth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    navigate("/auth?role=merchant", { replace: true });
  }, []);

  return null;
};

export default MerchantAuth;
