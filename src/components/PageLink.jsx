import { Link } from "react-router-dom";
import { isInternal, resolveHref } from "../routes.js";

export default function PageLink({ href, to, children, ...rest }) {
  const target = href ?? to;
  if (isInternal(target)) {
    return (
      <Link to={resolveHref(target)} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={target} {...rest}>
      {children}
    </a>
  );
}
