import { keyframes } from "@emotion/core";
import React from "react";
import { TransitionStatus } from "react-transition-group/Transition";
import { styled, useTheme } from "~/components";
import { NotificationModel } from "~/app/appTypes";

const slideInRight = keyframes({
  from: {
    transform: "translate3d(100%, 0, 0)",
  },
  to: {
    transform: "translate3d(0, 0, 0)",
  },
});

const slideOutLeft = keyframes({
  from: {
    opacity: 1,
    transform: "translate3d(0, 0, 0)",
  },
  to: {
    opacity: 0,
    transform: "translate3d(100%, 0, 0)",
  },
});

const Base = styled.div(
  {
    border: "none",
    borderRadius: "0.375rem",
    width: "20rem",
    padding: "1rem",
    position: "absolute",
    right: "1rem",
    transition: "top 500ms ease-out",
  },
  ({ theme }) => ({
    background: theme.colors.midnight,
    boxShadow: theme.elevation.dp4,
    color: theme.colors.white,
    height: `${theme.sizes.notificationHeight}rem`,
  }),
);

const Flag = styled.span(
  {
    position: "absolute",
    bottom: "2.25rem",
    right: "-1.375rem",
    width: 0,
    height: 0,
    pointerEvents: "none",
    borderStyle: "solid",
    borderWidth: "1.5rem 1rem 0",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    transform: "rotate(270deg)",
  },
  ({ theme }) => ({
    borderTopColor: theme.colors.midnight,
  }),
);

interface Props {
  index: number;
  notification: NotificationModel;
  transitionStatus: TransitionStatus;
  onDismissNotification: (notificationId: string) => void;
}

const NotificationToast: React.FC<Props> = ({
  index,
  notification,
  transitionStatus,
  onDismissNotification,
  ...props
}) => {
  const { sizes } = useTheme();

  React.useEffect(() => {
    setTimeout(() => {
      onDismissNotification(notification.id);
    }, 5_000);
  }, []);

  const animation = {
    entering: `${slideInRight} 300ms 1 linear both`,
    exiting: `${slideOutLeft} 600ms 1 linear both`,
  }[transitionStatus];

  // Height of notification plus 1rem for bottom padding:
  const topRems = index * (sizes.notificationHeight + sizes.notificationGap);

  return (
    <Base role="status" css={{ animation, top: `${topRems}rem` }} {...props}>
      {notification.message}
      <Flag />
    </Base>
  );
};

export default NotificationToast;
