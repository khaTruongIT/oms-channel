"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import ErrorState from "./ErrorState";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={this.props.fallbackTitle || "Lỗi hiển thị thành phần"}
          message={
            this.props.fallbackMessage ||
            this.state.error?.message ||
            "Không thể tải nội dung này. Vui lòng bấm thử lại."
          }
          onRetry={() => {
            this.setState({ hasError: false, error: undefined });
            this.props.onReset?.();
          }}
        />
      );
    }

    return this.props.children;
  }
}
