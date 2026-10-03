"use client";

import React from "react";
import { ConfigProvider } from "antd";

const AntdConfigProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#EC407A",
          borderRadius: 8,
          fontFamily: "inherit",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntdConfigProvider;
