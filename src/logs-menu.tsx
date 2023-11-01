/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import React from "react";
import { Renderer, Common } from "@k8slens/extensions";

type Pod = Renderer.K8sApi.Pod;
type IPodContainer = Renderer.K8sApi.IPodContainer;
type Workload = Renderer.K8sApi.StatefulSet | Renderer.K8sApi.Deployment | Renderer.K8sApi.DaemonSet

const {
  Component: {
    Icon,
    SubMenu,
    MenuItem,
    StatusBrick,
    logTabStore,
    terminalStore,
    createTerminalTab,
  },
  Navigation,
} = Renderer;
const {
  App,
  Util,
} = Common;

export class PodLogsMenu extends React.Component<Renderer.Component.KubeObjectMenuProps<Pod>> {
  showLogs(container: IPodContainer) {
    Navigation.hideDetails();
    const pod = this.props.object;

    logTabStore.createPodTab({
      selectedPod: pod,
      selectedContainer: container,
    });
  }

  render() {
    const { object: pod, toolbar } = this.props;
    const containers = pod.getAllContainers();
    const statuses = pod.getContainerStatuses();

    if (!containers.length) return null;

    return (
      <MenuItem onClick={Util.prevDefault(() => this.showLogs(containers[0]))}>
        <Icon
          material="subject"
          interactive={toolbar}
          tooltip={toolbar && "Pod Logs"}
        />
        <span className="title">Logs</span>
        {containers.length > 1 && (
          <>
            <Icon className="arrow" material="keyboard_arrow_right"/>
            <SubMenu>
              {
                containers.map(container => {
                  const { name } = container;
                  const status = statuses.find(status => status.name === name);
                  const brick = status ? (
                    <StatusBrick
                      className={Util.cssNames(Object.keys(status.state)[0], { ready: status.ready })}
                    />
                  ) : null;

                  return (
                    <MenuItem
                      key={name}
                      onClick={Util.prevDefault(() => this.showLogs(container))}
                      className="flex align-center"
                    >
                      {brick}
                      <span>{name}</span>
                    </MenuItem>
                  );
                })
              }
            </SubMenu>
          </>
        )}
      </MenuItem>
    );
  }
}

export class WorkloadLogsMenu extends React.Component<Renderer.Component.KubeObjectMenuProps<Workload>> {
  showLogs(kubetailPath: string) {
    const { object: workload } = this.props;

    const commandParts = [
      kubetailPath,
      "-n", workload.getNs(),
      workload.getName()
    ];

    if (window.navigator.platform !== "Win32") {
      commandParts.unshift("exec");
    }

    const shell = createTerminalTab({
      title: `${workload.kind}: ${workload.getName()} (namespace: ${workload.getNs()}) [Tailed]`,
    });

    terminalStore.sendCommand(commandParts.join(" "), {
      enter: true,
      tabId: shell.id,
    });

    Navigation.hideDetails();
  }

  render() {
    const { object: workload, toolbar } = this.props;
    const kubetailPath = 'kubetail'; // TODO: Check if exists, if not, hide/warn
    return (
      <MenuItem onClick={Util.prevDefault(() => this.showLogs(kubetailPath))}>
        <Icon
          material="subject"
          interactive={toolbar}
          tooltip={toolbar && `${workload.kind} Logs`}
        />
        <span className="title">Logs</span>
      </MenuItem>
    );
  }
}
