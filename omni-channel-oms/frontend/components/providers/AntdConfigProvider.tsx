"use client";

import React from "react";
import { ConfigProvider } from "antd";
import { antdTokens } from "@/lib/design-tokens";

const AntdConfigProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConfigProvider
      theme={{
        token: { ...antdTokens },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntdConfigProvider;
