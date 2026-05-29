import React, { ComponentType } from 'react';
import { Box } from '@mui/material';
import Top from './Top';
import Footer from './Footer';

// HOC (Higher-Order Component) that wraps any page with the standard layout.
// Usage:
//   const MyPage = () => { return <div>Content</div>; };
//   export default withLayoutBasic(MyPage);

const withLayoutBasic = <P extends object>(WrappedPage: ComponentType<P>) => {
  const LayoutWrapper = (props: P) => {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Top />
        <Box
          component="main"
          sx={{
            flex: 1,
            maxWidth: 1280,
            width: '100%',
            mx: 'auto',
            px: { xs: 2, lg: 4 },
            py: 4,
          }}
        >
          <WrappedPage {...props} />
        </Box>
        <Footer />
      </Box>
    );
  };

  return LayoutWrapper;
};

export default withLayoutBasic;
