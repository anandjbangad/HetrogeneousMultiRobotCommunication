import pandas as pd
import numpy as np

dirlist = ["random", "topsis", "topsisQlearn", "topsisQlearnNN", "todim", "todimQlearn", "todimQlearnNN"]

for dirname in dirlist:
    df = pd.read_csv(dirname+"/"+"chart_edge_active_ctx_count.csv", index_col=False, header=0)

    df_1 = df['Edge Node']
    df_2 = df["Cloud Node"]

    df["edge_mm"] = df_1.expanding(min_periods=1).mean()
    df["cld_mm"]= df_2.expanding(min_periods=1).mean()
    df.to_csv(dirname+"/"+"chart_edge_active_ctx_count_updated.csv", index=False)

for dirname in dirlist:
    df = pd.read_csv(dirname+"/"+"chart_edge_cpu_mem_utilization.csv", index_col=False, header=0)

    df_1 = df["CPU Utilization"]
    df_2 = df["Free Memory"]

    df["cpu_mm"] = df_1.expanding(min_periods=1).mean()
    df["freemem_mm"]= df_2.expanding(min_periods=1).mean()
    df.to_csv(dirname+"/"+"chart_edge_cpu_mem_utilization_updated.csv", index=False)

for dirname in dirlist:
    df = pd.read_csv(dirname+"/"+"chart_edge_nodes_latency.csv", index_col=False, header=0)

    df_1 = df["Node Latency"]
    df_2 = df["Neighbor 1 Latency"]
    df_3 = df["Neighbor 2 Latency"]
    df_4 = df["Cloud Latency Average"]

    df["node_mm"] = df_1.expanding(min_periods=1).mean()
    df["neigh1_mm"]= df_2.expanding(min_periods=1).mean()
    df["neigh2_mm"] = df_3.expanding(min_periods=1).mean()
    df["cld_avg_mm"] = df_4.expanding(min_periods=1).mean()
    df.to_csv(dirname+"/"+"chart_edge_nodes_latency_updated.csv", index=False)

for dirname in dirlist:
    df = pd.read_csv(dirname+"/"+"chart_edge_offload_jobs_ratio.csv", index_col=False, header=0)

    df_1 = df["Neighbors/Local"]
    df_2 = df["Cloud/Local"]

    df["neigh/local_mm"] = df_1.expanding(min_periods=1).mean()
    df["cld/local_mm"]= df_2.expanding(min_periods=1).mean()
    df.to_csv(dirname+"/"+"chart_edge_offload_jobs_ratio_updated.csv", index=False)

for dirname in dirlist:
    df = pd.read_csv(dirname+"/"+"chart_deviceNode_response_latency.csv", index_col=False, header=0)

    df_1 = df["Latency (MM 5sec)"]
    df_2 = df["Latency Average"]

    df["latency_5sec_mm"] = df_1.expanding(min_periods=1).mean()
    df["latency_avg_mm"]= df_2.expanding(min_periods=1).mean()
    df.to_csv(dirname+"/"+"chart_deviceNode_response_latency_updated.csv", index=False)