import { ThemeProvider } from '@material-ui/core';
import React, { useEffect } from 'react';
import NoSSR from 'react-no-ssr';
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import Loading from '../../components/scenes/loading';
import Scene from "../../components/scenes/uiInteractive";
import Layout from '../../components/ui/Layout';
import { selectAuthState } from "../../redux/auth/selector";
import { doLoginAuto } from '../../redux/auth/service';
import { selectInstanceConnectionState } from '../../redux/instanceConnection/selector';
import theme from '../../theme';

interface Props {
    authState?: any;
    instanceConnectionState?: any;
    doLoginAuto?: any;
}

const mapStateToProps = (state: any): any => {
    return {
        authState: selectAuthState(state),
        instanceConnectionState: selectInstanceConnectionState(state)
    };
};

const mapDispatchToProps = (dispatch: Dispatch): any => ({
    doLoginAuto: bindActionCreators(doLoginAuto, dispatch)
});

export const objectInteractPage = (props: any): any => {
  const {
    authState,
    instanceConnectionState,
    doLoginAuto
  } = props;
  const selfUser = authState.get('user');
  const [ sceneIsVisible, setSceneVisible ] = React.useState(true);

  useEffect(() => {
      console.log('Index calling doLoginAuto');
      doLoginAuto(true);
  }, []);

  useEffect(() => {
      if (selfUser?.instanceId != null || instanceConnectionState.get('instanceProvisioned') === true) {
          setSceneVisible(true);
      }
  }, [selfUser?.instanceId, selfUser?.partyId, instanceConnectionState]);

  // <Button className="right-bottom" variant="contained" color="secondary" aria-label="scene" onClick={(e) => { setSceneVisible(!sceneIsVisible); e.currentTarget.blur(); }}>scene</Button>

  return(
    <ThemeProvider theme={theme}>
      <Layout pageTitle="Home">
        <NoSSR onSSR={<Loading/>}>
          {sceneIsVisible? (<Scene />) : null}
        </NoSSR>
      </Layout>
    </ThemeProvider>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(objectInteractPage);