import React from "react";
import { Link } from "react-router-dom";
import { styled } from "~/components";
import { RoutePath } from "~/typeDefs";

const Base = styled.header(
  {
    alignItems: "center",
    display: "flex",
    height: "3rem",
    justifyContent: "space-between",
    padding: "0 1rem",
    width: "100%",
  },
  ({ theme }) => ({
    background: theme.colors.primary,
    color: theme.colors.secondary,
  }),
);

const Header: React.FC = () => (
  <Base>
    <Link
      css={theme => ({ color: theme.colors.secondary, fontSize: "1.5rem" })}
      to={RoutePath.PickToolAction}
    >
      transfermyti.me
    </Link>
  </Base>
);

export default Header;
