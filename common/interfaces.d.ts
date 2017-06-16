export interface e_edge_req {
    type: string,
    payload: string,
    task_id: number,
    sentTime: number,
    ttl: number
}
export interface i_edge_req extends e_edge_req {
    cmd_id: number

}
export interface e_edge_rsp {
    type: string,
    result: string,
    task_id: number,
    ttl: number,
    sentTime: number
}
export interface i_edge_rsp extends e_edge_rsp {
    cmd_id: number,
    sentTime: number
}

export interface cld_edge_init {
    type: string,
    uuid: string,
    sessionID: number
}
export interface cld_edge_services {
    type: string,
    uuid: string,
    sessionID: number,
    services: any,
    gps: Object
}
export interface cld_edge_getNeighbors {
    type: string,
    uuid: string,
    sessionID: number,
    count: number
}
export interface cld_publish_topics {
    cpu: number,
    freemem: number,
    msgCount: number,
    activeCtx: number
}

export interface i_python_rsp {
    offloadTo: number
}
export interface i_python_req {
    type: string,
    payload: string,
    matrix: number[],
    n_alternatives: number,
    m_criterias: number
}