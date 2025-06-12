import yaml
import os

def Config():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(base_dir, "config.yml")
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)